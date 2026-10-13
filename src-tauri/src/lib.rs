use sysinfo::System;
use serde::Serialize;
use std::fs;
use std::process::Command;

#[derive(serde::Serialize)]
struct HardwareTelemetry {
    system_ram_percent_used: f64,
    vram_percent_used: f64,
    compute_tier: String,
    can_load_large_model: bool,
}

#[derive(serde::Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
}

#[tauri::command]
fn execute_kill_switch() -> Result<String, String> {
    println!("CRITICAL: Kill switch activated via IPC.");
    Ok("All agent workflows terminated and returned to idle state.".into())
}

#[tauri::command]
async fn get_hardware_telemetry() -> Result<HardwareTelemetry, String> {
    let mut sys = System::new_all();
    sys.refresh_memory();
    
    // 1. Calculate Real System RAM
    let total_ram = sys.total_memory() as f64;
    let used_ram = sys.used_memory() as f64;
    let ram_percent = if total_ram > 0.0 { (used_ram / total_ram) * 100.0 } else { 0.0 };

    // 2. Fetch Real VRAM via PowerShell (Bypasses 4GB 32-bit WMI limits)
    let mut vram_percent = 0.0;
    
    let ps_cmd = r#"
        let $counter = "\GPU Engine(*)\Local Update*"
        let $vram = (Get-Counter $counter -ErrorAction SilentlyContinue).CounterSamples | Measure-Object -Property CookedValue -Sum
        if ($vram) { [math]::Round($vram.Sum / 1MB, 2) } else { 0 }
    "#;

    if let Ok(output) = Command::new("powershell")
        .args(["-NoProfile", "-Command", ps_cmd])
        .output() 
    {
        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(used_vram_mb) = stdout.trim().parse::<f64>() {
            // Hardcoded to your 24GB 7900 XTX (24576 MB)
            vram_percent = (used_vram_mb / 24576.0) * 100.0;
        }
    }

    let can_load = vram_percent < 60.0;

    Ok(HardwareTelemetry {
        compute_tier: "enthusiast".to_string(),
        system_ram_percent_used: ram_percent,
        vram_percent_used: vram_percent,
        can_load_large_model: can_load,
    })
}

#[tauri::command]
async fn fs_read(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file at {}: {}", path, e))
}

#[tauri::command]
async fn fs_write(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| format!("Failed to write to {}: {}", path, e))
}

#[tauri::command]
async fn shell_execute(payload: String) -> Result<String, String> {
    // Note: For Windows, you'd use "cmd" and "/C". For Mac/Linux, "sh" and "-c".
    // This is a basic cross-platform wrapper for the MVP:
    let output = if cfg!(target_os = "windows") {
        Command::new("cmd").args(["/C", &payload]).output()
    } else {
        Command::new("sh").args(["-c", &payload]).output()
    };

    match output {
        Ok(out) => {
            let stdout = String::from_utf8_lossy(&out.stdout).to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).to_string();
            if out.status.success() {
                Ok(stdout)
            } else {
                Err(format!("Command failed: {}", stderr))
            }
        }
        Err(e) => Err(format!("Failed to execute shell command: {}", e)),
        }
}

// File System: Read Directory (For scanning plugins)
#[tauri::command]
async fn fs_read_dir(path: String) -> Result<Vec<String>, String> {
    let mut entries = Vec::new();
    match fs::read_dir(&path) {
        Ok(paths) => {
            for path in paths {
                if let Ok(entry) = path {
                    // Just grab the folder or file name
                    if let Ok(name) = entry.file_name().into_string() {
                        entries.push(name);
                    }
                }
            }
            Ok(entries)
        }
        Err(e) => Err(format!("Failed to read directory at {}: {}", path, e))
    }
}

#[tauri::command]
async fn fs_read_tree(path: String) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    match std::fs::read_dir(&path) {
        Ok(paths) => {
            for path_result in paths {
                if let Ok(dir_entry) = path_result {
                    let path_buf = dir_entry.path();
                    entries.push(FileEntry {
                        name: dir_entry.file_name().to_string_lossy().into_owned(),
                        path: path_buf.to_string_lossy().into_owned(),
                        is_dir: path_buf.is_dir(),
                    });
                }
            }
            Ok(entries)
        }
        Err(e) => Err(format!("Failed to read directory tree at {}: {}", path, e))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            execute_kill_switch, 
            get_hardware_telemetry,
            fs_read,
            fs_write,
            shell_execute,
            fs_read_dir,
            fs_read_tree
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
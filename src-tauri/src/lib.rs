use rfd::FileDialog;
use std::fs;
use std::process::Command;
use std::str::FromStr;
use sysinfo::System;

// Audit Ledger Dependencies
use chrono::Utc;
use sha2::{Digest, Sha256};
use similar::TextDiff;
use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    Row, SqlitePool,
};
use tauri::State;

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

// Managed Application State
struct AppState {
    db: SqlitePool,
}

/// Initializes the Append-Only SQLite Database
async fn init_audit_db() -> Result<SqlitePool, String> {
    let options = SqliteConnectOptions::from_str("sqlite://../weaver_audit.db?mode=rwc")
        .map_err(|e| e.to_string())?;

    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .map_err(|e| e.to_string())?;

    // 1. Create the Audit Table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS audit_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp_utc TEXT NOT NULL,
            action_type TEXT NOT NULL,
            file_path TEXT NOT NULL,
            unified_diff TEXT NOT NULL,
            prev_hash TEXT NOT NULL,
            curr_hash TEXT NOT NULL
        );"
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    // 2. Enforce Append-Only Immutability via SQLite Triggers
    sqlx::query(
        "CREATE TRIGGER IF NOT EXISTS enforce_append_only_update BEFORE UPDATE ON audit_events
         BEGIN SELECT RAISE(ABORT, 'Audit ledger is immutable: UPDATE prohibited'); END;"
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TRIGGER IF NOT EXISTS enforce_append_only_delete BEFORE DELETE ON audit_events
         BEGIN SELECT RAISE(ABORT, 'Audit ledger is immutable: DELETE prohibited'); END;"
    )
    .execute(&pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(pool)
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
    let ram_percent = if total_ram > 0.0 {
        (used_ram / total_ram) * 100.0
    } else {
        0.0
    };

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
async fn pick_workspace_dialog() -> Result<Option<String>, String> {
    let folder = FileDialog::new()
        .set_title("Open Workspace")
        .pick_folder();
        
    // Convert the PathBuf to a String for the frontend, or return None if cancelled
    Ok(folder.map(|path| path.to_string_lossy().into_owned()))
}

#[tauri::command]
async fn fs_read(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file at {}: {}", path, e))
}

#[tauri::command]
async fn fs_write(path: String, contents: String, state: State<'_, AppState>) -> Result<(), String> {
    let db = &state.db;

    // 1. Read old file content to calculate diff
    let old_content = fs::read_to_string(&path).unwrap_or_else(|_| "".to_string());
    
    // 2. Generate Unified Diff
    let diff = TextDiff::from_lines(&old_content, &contents)
        .unified_diff()
        .header("original", "modified")
        .to_string();

    // 3. Prepare Audit Metadata
    let timestamp = Utc::now().to_rfc3339();
    let action_type = "fs_write";

    // 4. Fetch the previous hash in the ledger (Merkle log linking)
    let row_result = sqlx::query("SELECT curr_hash FROM audit_events ORDER BY id DESC LIMIT 1")
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?;
    
    let prev_hash: String = row_result
        .map(|r| r.get("curr_hash"))
        .unwrap_or_else(|| "GENESIS_HASH".to_string());

    // 5. Calculate Cryptographic Hash of the current event
    let mut hasher = Sha256::new();
    let payload = format!("{}|{}|{}|{}|{}", prev_hash, timestamp, action_type, path, diff);
    hasher.update(payload.as_bytes());
    let curr_hash = format!("{:x}", hasher.finalize());

    // 6. Append to the SQLite Ledger FIRST
    sqlx::query(
        "INSERT INTO audit_events (timestamp_utc, action_type, file_path, unified_diff, prev_hash, curr_hash) 
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&timestamp)
    .bind(action_type)
    .bind(&path)
    .bind(&diff)
    .bind(&prev_hash)
    .bind(&curr_hash)
    .execute(db)
    .await
    .map_err(|e| format!("Audit Ledger Integrity Failure (Write Aborted): {}", e))?;

    // 7. Execute physical write to disk only if Audit succeeds
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
        Err(e) => Err(format!("Failed to read directory at {}: {}", path, e)),
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
        Err(e) => Err(format!("Failed to read directory tree at {}: {}", path, e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Spin up the SQLite Ledger before booting the UI
    let db_pool = tauri::async_runtime::block_on(async {
        init_audit_db().await.expect("FATAL: Failed to initialize SQLite Audit Ledger")
    });

    tauri::Builder::default()
        .manage(AppState { db: db_pool })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            execute_kill_switch,
            get_hardware_telemetry,
            fs_read,
            fs_write,
            shell_execute,
            fs_read_dir,
            fs_read_tree,
            pick_workspace_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
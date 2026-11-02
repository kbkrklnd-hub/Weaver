use std::fs;
use std::path::PathBuf;
use wasmtime::{Config, Engine as WasmEngine, Linker, Module, Store};
use wasmtime_wasi::WasiCtxBuilder;
use bollard::Docker;
use bollard::models::{ContainerCreateBody, HostConfig};
use bollard::query_parameters::WaitContainerOptionsBuilder;
use futures_util::StreamExt;
use regorus::Engine;
use chrono::Utc;
use sha2::{Digest, Sha256};
use similar::TextDiff;
use sqlx::{sqlite::{SqliteConnectOptions, SqlitePoolOptions}, Row, SqlitePool};
use std::str::FromStr;
use tracing::{info, error, instrument};

#[instrument]
pub fn validate_and_stage_patch(
    workspace_path: &str,
    file_path: &str,
    start_line: usize,
    end_line: usize,
    replacement_code: &str,
) -> Result<String, String> {
    info!("Staging patch for {} at lines {}-{}", file_path, start_line, end_line);
    let mut resolved_path = PathBuf::from(workspace_path);
    let clean_file_path = file_path.trim_start_matches('/').trim_start_matches('\\');
    
    let file_path_buf = PathBuf::from(clean_file_path);
    if file_path_buf.is_absolute() || file_path.contains(':') {
        resolved_path = PathBuf::from(file_path);
    } else {
        resolved_path.push(clean_file_path);
    }

    let existing_content = fs::read_to_string(&resolved_path).unwrap_or_else(|_| String::new());
    let mut lines: Vec<String> = existing_content.lines().map(String::from).collect();

    let start_idx = if start_line > 0 { start_line - 1 } else { 0 };
    let end_idx = if end_line > 0 { end_line - 1 } else { 0 };

    while lines.len() <= start_idx {
        lines.push(String::new());
    }

    let delete_end = (end_idx + 1).min(lines.len()).max(start_idx);
    let new_lines: Vec<String> = replacement_code.lines().map(String::from).collect();
    lines.splice(start_idx..delete_end, new_lines);

    let updated_content = lines.join("\n");

    fs::write(&resolved_path, updated_content)
        .map_err(|e| format!("Failed to write patched file: {}", e))?;

    let file_name = resolved_path.file_name().unwrap_or_default().to_string_lossy();
    Ok(format!("Successfully patched {} (lines {}-{})", file_name, start_line, end_line))
}

pub async fn wasi_execute(wasm_path: &str, workspace_path: &str) -> Result<String, String> {
    let mut config = Config::new();
    config.consume_fuel(true);
    
    let engine = WasmEngine::new(&config).map_err(|e| format!("WASI Engine failed: {}", e))?;
    let mut linker = Linker::new(&engine);
    
    wasmtime_wasi::add_to_linker(&mut linker, |s| s)
        .map_err(|e| format!("Failed to link WASI: {}", e))?;
        
    let preopened_dir = wasmtime_wasi::Dir::open_ambient_dir(
        workspace_path, 
        wasmtime_wasi::ambient_authority()
    ).map_err(|e| format!("Failed to open workspace for sandboxing: {}", e))?;

    let mut builder = WasiCtxBuilder::new();
    builder.inherit_stdio();

    builder.preopened_dir(preopened_dir, "/workspace")
        .map_err(|e| format!("Failed to map virtual directory: {}", e))?;
        
    let wasi_ctx = builder.build();
    let mut store = Store::new(&engine, wasi_ctx);
    store.add_fuel(10_000_000).map_err(|e| format!("Failed to inject CPU fuel: {}", e))?; 

    let module = Module::from_file(&engine, wasm_path)
        .map_err(|e| format!("Failed to load WASM binary at {}: {}", wasm_path, e))?;

    linker.module(&mut store, "", &module).map_err(|e| e.to_string())?;
    let instance = linker.instantiate(&mut store, &module).map_err(|e| e.to_string())?;

    let start = instance.get_typed_func::<(), ()>(&mut store, "_start")
        .map_err(|e| format!("Invalid WASM (no _start function found): {}", e))?;
    
    match start.call(&mut store, ()) {
        Ok(_) => Ok("WASI Sandbox Execution Completed Successfully.".to_string()),
        Err(e) => Err(format!("WASI Sandbox Trapped/Terminated: {}", e))
    }
}

#[instrument]
pub async fn execute_oci_container(
    image: String,
    cmd: Vec<String>,
    workspace_path: String,
) -> Result<String, String> {
    info!("Spawning isolated OCI container: {}", image);
    let docker = Docker::connect_with_local_defaults()
        .map_err(|e| format!("Docker/Podman daemon connection failed: {}", e))?;

    let host_config = HostConfig {
        binds: Some(vec![format!("{}:/workspace", workspace_path)]),
        network_mode: Some("none".to_string()),
        ..Default::default()
    };

    let config = ContainerCreateBody {
        image: Some(image),
        cmd: Some(cmd),
        host_config: Some(host_config),
        working_dir: Some("/workspace".to_string()),
        ..Default::default()
    };

    // Notice the removed ::<&str, String> generics here
    let container = docker
        .create_container(None, config)
        .await
        .map_err(|e| format!("Container creation failed: {}", e))?;

    // Removed the ::<String> generic here
    docker
        .start_container(&container.id, None)
        .await
        .map_err(|e| format!("Container start failed: {}", e))?;

    // Bollard v0.21+ uses builders for query options
    let wait_options = WaitContainerOptionsBuilder::default()
        .condition("not-running")
        .build();

    let mut wait_stream = docker.wait_container(&container.id, Some(wait_options));

    while let Some(msg) = wait_stream.next().await {
        match msg {
            Ok(response) => {
                if response.status_code != 0 {
                    let _ = docker.remove_container(&container.id, None).await;
                    return Err(format!("Container exited with non-zero code: {}", response.status_code));
                }
            }
            Err(e) => {
                let _ = docker.remove_container(&container.id, None).await;
                return Err(format!("Container wait stream error: {}", e));
            }
        }
    }

    let _ = docker.remove_container(&container.id, None).await;
    Ok(format!("OCI Container execution successful."))
}

pub struct CoreState {
    pub db: SqlitePool,
}

pub async fn init_core_state() -> Result<CoreState, String> {
    let options = SqliteConnectOptions::from_str("sqlite://../weaver_audit.db?mode=rwc")
        .map_err(|e| e.to_string())?;

    let pool = SqlitePoolOptions::new()
        .connect_with(options)
        .await
        .map_err(|e| e.to_string())?;

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

    Ok(CoreState { db: pool })
}

#[instrument(skip(state))]
pub async fn fs_write(path: &str, contents: &str, state: &CoreState) -> Result<(), String> {
    info!("Evaluating OPA policy for write access to: {}", path);
    let mut engine = Engine::new();
    
    let policy = r#"
    package weaver.workspace

    default allow = false

    allow {
        not blocked_path
    }

    blocked_path { contains(input.file_path, ".env") }
    blocked_path { contains(input.file_path, ".git/") }
    blocked_path { contains(input.file_path, ".git\\") }
    blocked_path { contains(input.file_path, "../") }
    blocked_path { contains(input.file_path, "..\\") }
    "#;

    engine.add_policy("workspace_guard.rego".to_string(), policy.to_string())
        .map_err(|e| format!("Policy Load Error: {}", e))?;

    let input = serde_json::json!({ "file_path": path });
    engine.set_input(input.into());

    let results = engine.eval_query("data.weaver.workspace.allow".to_string(), false)
        .map_err(|e| format!("Policy Eval Error: {}", e))?;

    let is_allowed = results.result.first()
        .and_then(|r| r.expressions.first())
        .map(|v| *v.value.as_bool().unwrap_or(&false))
        .unwrap_or(false);

    if !is_allowed {
        return Err(format!("SECURITY VIOLATION: Write access to '{}' denied by workspace OPA policy.", path));
    }

    let db = &state.db;

    let old_content = fs::read_to_string(path).unwrap_or_else(|_| "".to_string());
    
    // Use .as_str() so both arguments are evaluated as &str
    let diff = TextDiff::from_lines(old_content.as_str(), contents)
        .unified_diff()
        .header("original", "modified")
        .to_string();

    let timestamp = Utc::now().to_rfc3339();
    let action_type = "fs_write";

    let row_result = sqlx::query("SELECT curr_hash FROM audit_events ORDER BY id DESC LIMIT 1")
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?;
    
    let prev_hash: String = row_result
        .map(|r| r.get("curr_hash"))
        .unwrap_or_else(|| "GENESIS_HASH".to_string());

    let mut hasher = Sha256::new();
    let payload = format!("{}|{}|{}|{}|{}", prev_hash, timestamp, action_type, path, diff);
    hasher.update(payload.as_bytes());
    let curr_hash = format!("{:x}", hasher.finalize());

    sqlx::query(
        "INSERT INTO audit_events (timestamp_utc, action_type, file_path, unified_diff, prev_hash, curr_hash) 
         VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&timestamp)
    .bind(action_type)
    .bind(path)
    .bind(&diff)
    .bind(&prev_hash)
    .bind(&curr_hash)
    .execute(db)
    .await
    .map_err(|e| format!("Audit Ledger Integrity Failure (Write Aborted): {}", e))?;

    fs::write(path, contents).map_err(|e| format!("Failed to write to {}: {}", path, e))
}

pub fn init_telemetry() {
    // Initializes the OpenTelemetry-compatible tracing subscriber
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive("weaver_core=debug".parse().unwrap()))
        .with_target(false)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .compact()
        .init();

    info!("OpenTelemetry tracing pipeline initialized.");
}
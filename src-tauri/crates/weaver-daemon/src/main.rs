use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use weaver_core::CoreState;

// Define the API request payload for patching files
#[derive(Deserialize)]
struct PatchRequest {
    workspace_path: String,
    file_path: String,
    start_line: usize,
    end_line: usize,
    replacement_code: String,
}

#[derive(Serialize)]
struct PatchResponse {
    status: String,
    message: String,
}

// Shared application state
struct DaemonState {
    core: CoreState,
}

#[tokio::main]
async fn main() {
    weaver_core::init_telemetry();
    // 1. Boot the SQLite Audit Ledger
    println!("Booting Weaver Daemon...");
    let core_state = weaver_core::init_core_state()
        .await
        .expect("FATAL: Failed to initialize Core State");

    let shared_state = Arc::new(DaemonState { core: core_state });

    // 2. Build the router map
    let app = Router::new()
        .route("/health", get(|| async { "Weaver Daemon is Online" }))
        .route("/api/patch", post(handle_patch))
        .with_state(shared_state);

    // 3. Bind the server to a local port
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3030").await.unwrap();
    println!("Weaver Daemon listening on http://127.0.0.1:3030");
    
    axum::serve(listener, app).await.unwrap();
}

// 4. The API Handler bridging the HTTP request to the Core Library
async fn handle_patch(
    State(_state): State<Arc<DaemonState>>,
    Json(payload): Json<PatchRequest>,
) -> Result<Json<PatchResponse>, (StatusCode, String)> {
    
    match weaver_core::validate_and_stage_patch(
        &payload.workspace_path,
        &payload.file_path,
        payload.start_line,
        payload.end_line,
        &payload.replacement_code,
    ) {
        Ok(msg) => Ok(Json(PatchResponse {
            status: "success".to_string(),
            message: msg,
        })),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Patch failed: {}", e),
        )),
    }
}
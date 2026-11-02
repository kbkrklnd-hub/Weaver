# Weaver

**A Local-First, Zero-Trust AI Agent Orchestration IDE & Execution Engine**

![Version](https://img.shields.io/badge/version-v1.7.0--Enterprise-emerald)
![Stack](https://img.shields.io/badge/stack-Tauri_v2_%7C_Rust_%7C_React_%7C_TypeScript-blue)
![Inference](https://img.shields.io/badge/inference-100%25_Local_(Ollama)-orange)
![License](https://img.shields.io/badge/license-Apache_2.0-zinc)

Weaver is a modular desktop operating system for autonomous workflows. Built on a high-performance **Tauri v2** shell and a **Rust** backend, it provides a hyper-secure, air-gapped environment where specialized local LLMs (via Ollama) can physically interact with your filesystem and write code without compromising host system security.

---

## 🚀 Core Philosophy
* **100% Local Inference:** No cloud APIs. No data exfiltration. Weaver runs entirely on your local hardware.
* **Strict IPC Security Boundary:** The React presentation layer has zero native capabilities. All execution requests, file I/O, and native OS dialogs are ferried through strongly-typed, deniable Tauri Rust commands to the decoupled `weaver-core`.
* **Transparent Cognition:** Agent reasoning is demystified. A unified System Trace panel serializes system events, hardware telemetry, and XML-tagged LLM planning (`<thought>`) into a single chronological feed.

---

## ⚡ Features (v1.7.0 Enterprise & Phase 6 Complete)
* **Hybrid Smart-Detection Setup Wizard:** Automated first-boot onboarding routine that queries local model availability (`GET /api/tags`) and provides seamless 1-click weight pulling.
* **Hexagonal Workspace Architecture:** Core processing is entirely decoupled into `weaver-core` (pure Rust state machine), serving both `weaver-desktop` (Tauri GUI) and `weaver-daemon` (headless Axum API for CI/CD ingestion).
* **Dual-Tier Container Sandboxing:** Agents execute untrusted code strictly within Tier-1 `wasmtime` fuel-limited WASI sandboxes or Tier-2 `bollard` network-isolated ephemeral OCI Docker/Podman containers.
* **OpenTelemetry Observability:** Built-in `tracing` instrumentation streams environment-filtered, thread-aware spans of all AI decisions, container spin-ups, and ledger diffs for SIEM tools.
* **Native Monaco IDE & Multi-Tab Engine:** Embedded `@monaco-editor/react` with VS Code-style multi-tab management, custom TypeScript/JSX diagnostic compilers, and dynamic global state syncing. The LLM always knows exactly which file you are looking at.
* **Autonomous "Director" Semantic Router:** A background routing agent (`llama3.1:8b`) that analyzes prompt intent in real time and dynamically dispatches tasks to specialized local worker models (`codestral`, `qwen2.5-coder`).
* **Production Build Pipeline:** Fully packaged standalone installers generated natively via the Tauri v2 release build pipeline.

---

## ⚡ Features (v1.7.0 Enterprise)
* **Hexagonal Workspace Architecture:** Core processing is entirely decoupled into `weaver-core` (pure Rust state machine), serving both `weaver-desktop` (Tauri GUI) and `weaver-daemon` (headless Axum API for CI/CD ingestion).
* **Dual-Tier Container Sandboxing:** Agents execute untrusted code strictly within Tier-1 `wasmtime` fuel-limited WASI sandboxes or Tier-2 `bollard` network-isolated ephemeral OCI Docker/Podman containers.
* **OpenTelemetry Observability:** Built-in `tracing` instrumentation streams environment-filtered, thread-aware spans of all AI decisions, container spin-ups, and ledger diffs for SIEM tools.
* **Native Monaco IDE & Multi-Tab Engine:** Embedded `@monaco-editor/react` with VS Code-style multi-tab management, custom TypeScript/JSX diagnostic compilers, and dynamic global state syncing. The LLM always knows exactly which file you are looking at.
* **Autonomous "Director" Semantic Router:** A background routing agent (`llama3.1:8b`) that analyzes prompt intent in real time and dynamically dispatches tasks to specialized local worker models (`codestral` for synthesis/edits, `qwen2.5-coder` for critique).
* **Dynamic Plugin Discovery:** A zero-mock plugin architecture. Weaver scans the host filesystem for `manifest.json` configurations and hot-loads external application bridges (e.g., Unreal Engine 5, DAWs) on the fly via `\pi` namespace routing.

---

## 🏗️ Architectural Evolution: v1.0.1 MVP vs. v1.7.0 Enterprise Engine

Weaver was engineered first as a functional desktop MVP (**v1.0.x**) to validate local multi-agent routing. With **v1.7.0**, it has successfully migrated into an enterprise-grade execution engine.

| Architectural Domain | Legacy State (v1.1.0 Governance) | Current State (v1.7.0 Enterprise Hardened) |
| :--- | :--- | :--- |
| **Process & Tool Sandboxing** | File I/O routed through Rust, but external shell commands were uncontainerized. | **Dual-Tier Isolation:** Embedded **Wasmtime (WASI)** and rootless **OCI Containers (`bollard`)**. |
| **Orchestration Topology** | Orchestration loop and state management executed inside the Tauri desktop lifecycle. | **Hexagonal Daemon (`weaver-daemon`):** Pure-Rust `weaver-core` exposing a headless **Axum API** for CI/CD pipelines. |
| **Auditability & Telemetry** | Append-only **SQLite (`sqlx` WAL)** database with SHA-256 Merkle hash-chaining. | **OpenTelemetry (OTLP):** Integrated `tracing` streams distributed execution spans and audit hashes directly. |
| **Agent Output & Governance** | Strict JSON Schema (GBNF) logit-level enforcement and Review Council evaluation. | **Policy-as-Code:** Embedded **Open Policy Agent (`regorus` OPA/Rego)** RBAC interceptor statically blocks unauthorized operations. |

---

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, Wouter, Lucide Icons, Monaco Editor (`@monaco-editor/react`), Vite
* **Backend:** Rust, Axum, Tauri v2 IPC, `rfd` (Native OS Dialogs), `serde` / `serde_json`, `bollard` (Docker/Podman API), `wasmtime`
* **Inference Engine:** Local Ollama REST API (`localhost:11434`) supporting `llama3.1:8b`, `codestral`, `qwen2.5-coder:7b`, and custom Unsloth/Axolotl GGUF fine-tunes

---

## ⌨️ Command Terminal Quick Reference
Inside the Weaver Command Terminal, the **Director** routes standard prompts automatically, or you can use backslash commands for deterministic control:
* `\@<model_name> <prompt>` — Bypass the Director and hot-swap/force a specific local model or agent persona (e.g., `\@codestral`).
* `\pi <namespace>` — Load an installed plugin namespace context (e.g., `ide`, UE5, DAW bridges).
* `\exit` — Exit the active plugin context.
* `\sys <instructions>` — Update base system instructions with a live `[SYSTEM OVERRIDE]`.
* `\clear` — Clear terminal history.

---

## 📦 Installation & Build

**Current Prerequisites:**
1. [Node.js](https://nodejs.org/) (v18+ recommended)
2. [Rust & Cargo](https://www.rust-lang.org/tools/install)
3. [Ollama](https://ollama.ai/) (Running locally)
4. Docker Desktop or Podman (Required for Tier-2 OCI `bollard` Sandboxing)

    ollama pull llama3.1:8b
    ollama pull codestral
    ollama pull qwen2.5-coder:7b

**Development (Tauri Desktop):**
    
    npm install
    npm run tauri dev

**Development (Headless Daemon):**
    
    cargo run --bin weaver-daemon

**Build Executable:**
    
    npm run tauri build

---

## 📚 Documentation
* [Architecture & Review Council Details](ARCHITECTURE.md)
* [Development Roadmap](ROADMAP.md)
* [Security Doctrine](SECURITY_DOCTRINE.md)
* [Changelog](CHANGELOG.md)

## License
Released under the [Apache 2.0 License](LICENSE)[cite: 4, 6].


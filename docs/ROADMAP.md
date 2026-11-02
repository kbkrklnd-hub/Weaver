# Weaver: Project Roadmap & Manifest

## Manifest
**Weaver** is a modular, local-first AI orchestration platform and native operating system for autonomous workflows. It pairs a high-performance Tauri v2 desktop shell with native local backends (Ollama, Unsloth, Axolotl). It features an embedded developer environment with direct AI agent code manipulation, dynamic resource control, and a pluggable architecture that securely connects autonomous models to external creative suites—scaling from a single-tenant desktop companion into an enterprise-grade, distributed execution engine.

---

## Development Roadmap

### Phase 1: Foundation & Security Sandbox (Complete)
- [x] Initialize Tauri v2 (Rust backend, React frontend).
- [x] Implement the UI routing shell.
- [x] Establish `SECURITY_DOCTRINE.md` constraints.
- [x] Build the IPC Bridge.
- [x] Create the Master Kill Switch.

### Phase 2: The Inference Engine (Complete)
- [x] Build the Chat/Agent Interface.
- [x] Implement the Engine Bridge (Ollama REST API).
- [x] Build Hardware Telemetry with live VRAM and RAM polling.
- [x] Build Global State (Zustand).

### Phase 3: Command Palette & Agent Orchestration (Complete)
- [x] UI Component Modularization.
- [x] Command Palette Architecture (`\@` and `\pi` routing).
- [x] Chronological System Trace Event Stream.
- [x] Active Stream Interruption.

### Phase 4: Plugin Architecture & OS Discovery (Complete)
- [x] Plugin Store & Interface (`IWeaverPlugin`).
- [x] Native Rust Discovery Bridge.
- [x] Dynamic Manifest Loading.
- [x] Human-in-the-Loop Security Gatekeeper (`ApprovalModal`).

### Phase 5: MVP Polish, Core IDE Execution & v1.0.1 Fast-Follow (Complete)
- [x] **UI Refactor:** Replace top-left shield with "W" logo; consolidate sidebar icons into a dynamic, collapsible plugin header.
- [x] **Local Models Dashboard:** Implement an Ollama-powered dashboard to list available models (`GET /api/tags`), download new models via input box (`POST /api/pull`), and display "Powered by Ollama" branding.
- [x] **Settings Refactor:** Implement a tabulated layout for Global Constraints, API Keys, and dynamic Plugin Options.
- [x] **CoT Visual Overhaul:** Box and border the active thought process panel to match the visual weight of standard security cards.
- [x] **Single-Prompt Review Council:** Implement the MVP version of the Multi-Agent Review Council.
- [x] **Multi-Tab IDE Engine (v1.0.1):** VS Code-style tab management (`openFiles` in Zustand).
- [x] **The "Director" Semantic Router (v1.0.1):** Lightweight background routing agent (`llama3.1:8b`).

### Phase 6: Flagship Polish & Public Portfolio Launch (Current)
- [x] **Rust-Native Workspace Picker (v1.0.1):** Replaced hardcoded MVP paths with a secure, backend-driven native OS folder dialog (`rfd` crate via `pick_workspace_dialog`).
- [x] **Extract Remaining Configs:** Move default fallback workspace configurations to a `.gitignore` local config file.
- [x] **GitHub & LinkedIn Launch:** Push the sanitized repo and demo assets publicly.
- [x] **Hybrid Smart-Detection Setup Wizard:** Design an onboarding UI that queries `GET /api/tags` on first boot.
- [x] **API Documentation:** Publish developer guides for the Weaver Plugin API.
- [x] **Executable Packaging:** Bundle and build the MVP installer via Tauri (`npm run tauri build`).

---

### Phase 7: v2.0 Scope — Enterprise Hardening, Governance & Distributed Daemon (Complete)
#### 7.1 True Process Sandboxing
- [x] **Tier-1 WASI Sandbox (`wasmtime`):** Enforce strict fuel/memory ceilings and capability-based directory pre-opens scoped exclusively to the active workspace.
- [x] **Tier-2 Rootless OCI Containers (`bollard`):** Integrated `bollard` (Podman/Docker API) to execute heavy compiler and CLI toolchains inside ephemeral, network-isolated (`--network=none`), read-only containers.
- [x] **Staged Sandbox Patching:** Migrated `edit_local_file` out of frontend DOM events into a backend sandbox staging tree (`validate_and_stage_patch`) that verifies before committing buffers to Monaco.

#### 7.2 Headless CI/CD Orchestrator (`weaver-daemon`)
- [x] **Hexagonal Cargo Workspace Split:** Decoupled the Rust execution engine from the React presentation layer by refactoring into `weaver-core` (pure-Rust state machine), `weaver-daemon` (headless background service), and `weaver-desktop` (thin Tauri UI client).
- [x] **HTTP API Server Ingestion:** Equipped `weaver-daemon` with an `axum` server to run non-interactive automation jobs and receive patch requests over port 3030.

#### 7.3 Immutable Audit Trails & SIEM Telemetry
- [x] **Append-Only SQLite WAL Ledger (`sqlx`):** Implemented the embedded SQLite database in Write-Ahead Logging mode with `BEFORE UPDATE`/`DELETE` `RAISE(ABORT)` triggers.
- [x] **OpenTelemetry (OTLP) Integration:** Instrumented `weaver-core` with `tracing` and `tracing-subscriber` to export distributed execution spans.

#### 7.4 Deterministic Policy, Multi-Agent DAG & Fine-Tuning
- [x] **Grammar-Constrained Structured Outputs:** Replaced regex and XML tag scraping with JSON Schemas.
- [x] **Embedded Policy-as-Code (OPA/Rego):** Integrated `regorus` to evaluate every proposed tool call against deterministic RBAC rules.

---

### Phase 8: v3.0 Scope (Cross-Platform Parity & Fine-Tuning)
- [ ] **Unsloth/Axolotl Integration:** Direct IDE pipelines for local model fine-tuning and agent building algorithms.
- [ ] **Linux & macOS Native Ports:** Refactor Windows-specific hardware telemetry to universal cross-platform Rust crates.
- [ ] **POSIX Compliant Architecture:** Ensure Tauri filesystem watchers and IPC bridges gracefully handle Unix/POSIX vs. Windows pathing dynamically.
- [ ] **Slack Plugin:** Deliver an integrated Slack webhook module to validate daemon messaging.

### Phase 9: v4.0 Scope (The Agentic OS)
- [ ] **Bare-Metal Bootloader:** Utilize a lightweight Linux kernel to boot the Weaver desktop environment as the primary, native system shell.
- [ ] **Window Manager Replacement:** Deprecate traditional OS window managers in favor of Weaver's dynamic workspace and plugin routing system.
- [ ] **Kernel-Level Agentic Access:** Grant the foundational orchestrator direct kernel and syslog read access.
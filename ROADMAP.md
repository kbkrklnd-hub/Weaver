# Weaver: Project Roadmap & Manifest

## Manifest
**Weaver** is a modular, local-first AI orchestration platform and native operating system for autonomous workflows[cite: 5]. It pairs a high-performance Tauri v2 desktop shell with native local backends (Ollama, Unsloth, Axolotl)[cite: 5]. It features an embedded developer environment with direct AI agent code manipulation, dynamic resource control, and a pluggable architecture that securely connects autonomous models to external creative suites[cite: 5]—scaling from a single-tenant desktop companion into an enterprise-grade, distributed execution engine.

---

## Development Roadmap

### Phase 1: Foundation & Security Sandbox (Complete)
- [x] Initialize Tauri v2 (Rust backend, React frontend)[cite: 5].
- [x] Implement the UI routing shell[cite: 5].
- [x] Establish `SECURITY_DOCTRINE.md` constraints[cite: 5].
- [x] Build the IPC Bridge[cite: 5].
- [x] Create the Master Kill Switch[cite: 5].

### Phase 2: The Inference Engine (Complete)
- [x] Build the Chat/Agent Interface[cite: 5].
- [x] Implement the Engine Bridge (Ollama REST API)[cite: 5].
- [x] Build Hardware Telemetry with live VRAM and RAM polling[cite: 5].
- [x] Build Global State (Zustand)[cite: 5].

### Phase 3: Command Palette & Agent Orchestration (Complete)
- [x] UI Component Modularization[cite: 5].
- [x] Command Palette Architecture (`\@` and `\pi` routing)[cite: 5].
- [x] Chronological System Trace Event Stream[cite: 5].
- [x] Active Stream Interruption[cite: 5].

### Phase 4: Plugin Architecture & OS Discovery (Complete)
- [x] Plugin Store & Interface (`IWeaverPlugin`)[cite: 5].
- [x] Native Rust Discovery Bridge[cite: 5].
- [x] Dynamic Manifest Loading[cite: 5].
- [x] Human-in-the-Loop Security Gatekeeper (`ApprovalModal`)[cite: 5].

### Phase 5: MVP Polish, Core IDE Execution & v1.0.1 Fast-Follow (Current)
*Goal: Finalize the UI for the v1.0.x portfolio release, establish multi-file ergonomics, and demonstrate local AI tool execution[cite: 5].*
- [x] **UI Refactor:** Replace top-left shield with "W" logo; consolidate sidebar icons into a dynamic, collapsible plugin header[cite: 5].
- [x] **Local Models Dashboard:** Implement an Ollama-powered dashboard to list available models (`GET /api/tags`), download new models via input box (`POST /api/pull`), and display "Powered by Ollama" branding[cite: 5].
- [x] **Settings Refactor:** Implement a tabulated layout for Global Constraints, API Keys, and dynamic Plugin Options[cite: 5].
- [x] **CoT Visual Overhaul:** Box and border the active thought process panel to match the visual weight of standard security cards[cite: 5].
- [x] **Single-Prompt Review Council:** Implement the MVP version of the Multi-Agent Review Council—a single meta-prompt that forces the active LLM to evaluate code modifications from Legal, Security, Optimization, and UX perspectives before returning a consolidated JSON tool call[cite: 5].
- [x] **Multi-Tab IDE Engine (v1.0.1):** VS Code-style tab management (`openFiles` in Zustand), active session persistence, interactive `File`/`Edit`/`View` toolbar menus, and Monaco JSX/XML diagnostic configuration[cite: 3].
- [x] **The "Director" Semantic Router (v1.0.1):** Lightweight background routing agent (`llama3.1:8b`) that classifies user prompts and automatically dispatches tasks to specialized local models (`codestral`, `qwen2.5-coder:7b`).

### Phase 6: Flagship Polish & Public Portfolio Launch (Current)
- [x] **Rust-Native Workspace Picker (v1.0.1):** Replaced hardcoded MVP paths with a secure, backend-driven native OS folder dialog (`rfd` crate via `pick_workspace_dialog`).
- [x] **GitHub & LinkedIn Launch:** Push the sanitized repo and demo assets publicly.
- [ ] **Hybrid Smart-Detection Setup Wizard:** Design an onboarding UI that queries `GET /api/tags` on first boot. Auto-selects preferred local models if present, or provides a graceful 1-click fallback download via `POST /api/pull` to prevent forced multi-gigabyte downloads during enterprise deployments.
- [ ] **Extract Remaining Configs:** Move default fallback workspace configurations to a `.gitignore` local config file.
- [ ] **API Documentation:** Publish developer guides for the Weaver Plugin API.
- [ ] **Executable Packaging:** Bundle and build the MVP installer via Tauri (`npm run tauri build`).

---

### Phase 7: v2.0 Scope — Enterprise Hardening, Governance & Distributed Daemon (Post-MVP)
*Goal: Pivot Weaver from a desktop companion into an enterprise-grade, multi-tiered execution engine with strict sandboxing, headless CI/CD operation, immutable auditing, and deterministic policy enforcement. (See `ARCHITECTURE_V2.md` for full specifications).*

#### 7.1 True Process Sandboxing
- [ ] **Tier-1 WASI Sandbox (`wasmtime`):** Replace raw OS shell invocation (`cmd /C`, `sh -c`) with an embedded `wasmtime` / `wasmtime-wasi` runtime enforcing strict fuel/memory ceilings and capability-based directory pre-opens scoped exclusively to the active workspace.
- [ ] **Tier-2 Rootless OCI Containers (`bollard`):** Integrate `bollard` (Podman/Docker API) to execute heavy compiler and CLI toolchains inside ephemeral, network-isolated (`--network=none`), read-only containers.
- [ ] **Staged Sandbox Patching:** Migrate `edit_local_file` out of frontend DOM events (`weaver-ai-edit`) into a backend sandbox staging tree (`validate_and_stage_patch`) that verifies syntax and compilation before committing buffers to Monaco.

#### 7.2 Headless CI/CD Orchestrator (`weaver-daemon`)
- [ ] **Hexagonal Cargo Workspace Split:** Decouple the Rust execution engine from the React presentation layer by refactoring into `weaver-core` (pure-Rust state machine & Ollama client), `weaver-daemon` (headless background service), and `weaver-desktop` (thin Tauri UI client).
- [ ] **gRPC & Message Queue Ingestion:** Equip `weaver-daemon` with a `tonic` gRPC server, `axum` WebSockets, and `async-nats` / `lapin` (RabbitMQ) consumers to run non-interactive automation jobs triggered by CI/CD pipelines.

#### 7.3 Immutable Audit Trails & SIEM Telemetry
- [x] **Append-Only SQLite WAL Ledger (`sqlx`):** Implemented the embedded SQLite database in Write-Ahead Logging mode with `BEFORE UPDATE` and `BEFORE DELETE` `RAISE(ABORT)` triggers and SHA-256 Merkle hash-chaining (`prev_hash -> curr_hash`) across unified diffs (`similar` crate).
- [ ] **OpenTelemetry (OTLP) Integration:** Instrument `weaver-core` with `tracing-opentelemetry` to export distributed execution spans and audit hashes to enterprise SIEM tools (Splunk, Datadog, Grafana).

#### 7.4 Deterministic Policy, Multi-Agent DAG & Fine-Tuning
- [x] **Grammar-Constrained Structured Outputs:** Replaced regex and XML tag scraping with JSON Schemas passed directly to Ollama's GBNF grammar engine, strictly enforcing tool schema compliance.
- [ ] **Embedded Policy-as-Code (OPA/Rego):** Integrate `regorus` to evaluate every proposed tool call against deterministic RBAC rules and file path blacklists before sandbox execution.

---

### Phase 8: v3.0 Scope (Cross-Platform Parity)
*Goal: Break OS-dependency and achieve full native cross-platform compliance[cite: 5].*
- [ ] **Linux & macOS Native Ports:** Refactor Windows-specific hardware telemetry (PowerShell WMI) to universal cross-platform Rust crates (`sysinfo`, NVML, ADLX)[cite: 5].
- [ ] **POSIX Compliant Architecture:** Ensure Tauri filesystem watchers and IPC bridges gracefully handle Unix/POSIX vs. Windows pathing dynamically[cite: 5].

### Phase 9: v4.0 Scope (The Agentic OS)
*Goal: Transition Weaver from a desktop application wrapper to a bare-metal, standalone operating system[cite: 5].*
- [ ] **Bare-Metal Bootloader:** Utilize a lightweight Linux kernel to boot the Weaver desktop environment as the primary, native system shell[cite: 5].
- [ ] **Window Manager Replacement:** Deprecate traditional OS window managers in favor of Weaver's dynamic workspace and plugin routing system[cite: 5].
- [ ] **Kernel-Level Agentic Access:** Grant the foundational orchestrator direct kernel and syslog read access for auto-healing, self-optimization, and ultra-low-latency file manipulation[cite: 5].
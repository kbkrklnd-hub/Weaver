# Weaver: Project Roadmap & Manifest

## Manifest
**Weaver** is a modular, local-first AI orchestration platform and native operating system for autonomous workflows[cite: 12]. It pairs a high-performance Tauri v2 desktop shell with native local backends (Ollama, Unsloth, Axolotl)[cite: 12]. It features an embedded developer environment with direct AI agent code manipulation, dynamic resource control, and a pluggable architecture that securely connects autonomous models to external creative suites[cite: 12].

---

## Development Roadmap

### Phase 1: Foundation & Security Sandbox (Complete)
- [x] Initialize Tauri v2 (Rust backend, React frontend)[cite: 12].
- [x] Implement the UI routing shell[cite: 12].
- [x] Establish `SECURITY_DOCTRINE.md` constraints[cite: 12].
- [x] Build the IPC Bridge[cite: 12].
- [x] Create the Master Kill Switch[cite: 12].

### Phase 2: The Inference Engine (Complete)
- [x] Build the Chat/Agent Interface[cite: 12].
- [x] Implement the Engine Bridge (Ollama REST API)[cite: 12].
- [x] Build Hardware Telemetry with live VRAM and RAM polling[cite: 12].
- [x] Build Global State (Zustand)[cite: 12].

### Phase 3: Command Palette & Agent Orchestration (Complete)
- [x] UI Component Modularization[cite: 12].
- [x] Command Palette Architecture (`\@` and `\pi` routing)[cite: 12].
- [x] Chronological System Trace Event Stream[cite: 12].
- [x] Active Stream Interruption[cite: 12].

### Phase 4: Plugin Architecture & OS Discovery (Complete)
- [x] Plugin Store & Interface (`IWeaverPlugin`)[cite: 12].
- [x] Native Rust Discovery Bridge[cite: 12].
- [x] Dynamic Manifest Loading[cite: 12].
- [x] Human-in-the-Loop Security Gatekeeper (`ApprovalModal`)[cite: 12].

### Phase 5: MVP Polish & Core IDE Execution (Current)
*Goal: Finalize the UI for the v1.0.0 portfolio release and demonstrate local AI tool execution.*
- [ ] **UI Refactor:** Replace top-left shield with "W" logo; consolidate sidebar icons into a dynamic, collapsible plugin header.
- [ ] **Local Models Dashboard:** Implement an Ollama-powered dashboard to list available models (`GET /api/tags`), download new models via input box (`POST /api/pull`), and display "Powered by Ollama" branding.
- [ ] **Settings Refactor:** Implement a tabulated layout for Global Constraints, API Keys, and dynamic Plugin Options.
- [ ] **CoT Visual Overhaul:** Box and border the active thought process panel to match the visual weight of standard security cards.
- [ ] **Single-Prompt Review Council:** Implement the MVP version of the Multi-Agent Review Council—a single meta-prompt that forces the active LLM to evaluate code modifications from Legal, Security, Optimization, and UX perspectives before returning a consolidated JSON tool call.

### Phase 6: v2.0 Scope (Post-MVP)
*Goal: Expand the core application with advanced orchestration, auditing, and fine-tuning features.*
- [ ] **The Fine-Tuning GUI:** Implement Unsloth / Axolotl visual dashboards (Currently mocked with "Coming in v2.0" banners).
- [ ] **Advanced Review Council Architecture:** Transition from the MVP Single-Prompt Council to the finalized architecture: Hardcoded Heuristics -> Lightweight Router LLM -> Final Multi-Perspective Check.
- [ ] **Audit & Data Integrity Agent:** Introduce a 5th specialized auditing agent dedicated exclusively to deep codebase context checks, preventing destructive cascading failures or unrecoverable data loss during autonomous operations.
- [ ] **Memory-Optimized Local Logging:** Implement an embedded SQLite database with strict rolling retention policies to maintain system accountability without ballooning disk space:
  - **30-Day Retention:** High-volume Chain of Thought telemetry and system trace events.
  - **6-Month Retention:** Immutable ledger of all atomic file edits and code diffs.
- [ ] **Dynamic Icon Loading:** Standardize the plugin API to pass custom SVGs/Icons from manifests to the dynamic sidebar header.

### Phase 7: Flagship Polish & Public Portfolio Launch
- [ ] **Remove Hardcoded Paths:** Extract local directory paths to a `.gitignore` config file.
- [ ] **API Documentation:** Publish developer guides for the Weaver Plugin API.
- [ ] **Executable Packaging:** Bundle and build the MVP installer via Tauri.
- [ ] **GitHub & LinkedIn Launch:** Push the sanitized repo and demo assets publicly.

### Phase 8: v3.0 Scope (Cross-Platform Parity)
*Goal: Break OS-dependency and achieve full native cross-platform compliance.*
- [ ] **Linux & macOS Native Ports:** Refactor Windows-specific hardware telemetry (PowerShell WMI) to universal cross-platform Rust crates.
- [ ] **POSIX Compliant Architecture:** Ensure Tauri filesystem watchers and IPC bridges gracefully handle Unix/POSIX vs. Windows pathing dynamically.

### Phase 9: v4.0 Scope (The Agentic OS)
*Goal: Transition Weaver from a desktop application wrapper to a bare-metal, standalone operating system.*
- [ ] **Bare-Metal Bootloader:** Utilize a lightweight Linux kernel to boot the Weaver desktop environment as the primary, native system shell.
- [ ] **Window Manager Replacement:** Deprecate traditional OS window managers in favor of Weaver's dynamic workspace and plugin routing system.
- [ ] **Kernel-Level Agentic Access:** Grant the foundational orchestrator direct kernel and syslog read access for auto-healing, self-optimization, and ultra-low-latency file manipulation.
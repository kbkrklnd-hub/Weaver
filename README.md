# Weaver

**A Local-First, Zero-Trust AI Agent Orchestration IDE & Execution Engine**

![Version](https://img.shields.io/badge/version-v1.1.--Governance-emerald)
![Stack](https://img.shields.io/badge/stack-Tauri_v2_%7C_Rust_%7C_React_%7C_TypeScript-blue)
![Inference](https://img.shields.io/badge/inference-100%25_Local_(Ollama)-orange)
![License](https://img.shields.io/badge/license-Apache_2.0-zinc)

Weaver is a modular desktop operating system for autonomous workflows[cite: 4, 5]. Built on a high-performance **Tauri v2** shell and a **Rust** backend, it provides a hyper-secure, air-gapped environment where specialized local LLMs (via Ollama) can physically interact with your filesystem and write code without compromising host system security[cite: 4].

---

## 🚀 Core Philosophy
* **100% Local Inference:** No cloud APIs[cite: 4]. No data exfiltration[cite: 4]. Weaver runs entirely on your local hardware[cite: 4].
* **Strict IPC Security Boundary:** The React presentation layer has zero native capabilities[cite: 4]. All execution requests, file I/O, and native OS dialogs are ferried through strongly-typed, deniable Tauri Rust commands[cite: 4].
* **Transparent Cognition:** Agent reasoning is demystified[cite: 4]. A unified System Trace panel serializes system events, hardware telemetry, and XML-tagged LLM planning (`<thought>`) into a single chronological feed[cite: 2, 4].

---

## ⚡ Features (v1.0.1 MVP)
* **Native Monaco IDE & Multi-Tab Engine:** Embedded `@monaco-editor/react` with VS Code-style multi-tab management, custom TypeScript/JSX diagnostic compilers, interactive `File`/`Edit`/`View` menus, and dynamic global state syncing[cite: 3, 4]. The LLM always knows exactly which file you are looking at[cite: 2, 4].
* **Autonomous "Director" Semantic Router:** A background routing agent (`llama3.1:8b`) that analyzes prompt intent in real time and dynamically dispatches tasks to specialized local worker models (`codestral` for synthesis/edits, `qwen2.5-coder` for critique, or custom Unsloth GGUF fine-tunes), while still supporting manual `\@model` overrides[cite: 2].
* **Multi-Agent Review Council:** A meta-prompting architecture that forces the LLM to evaluate its own proposed file edits from Security, Legal, Optimization, and UX perspectives before execution[cite: 4, 5].
* **Dynamic Plugin Discovery:** A zero-mock plugin architecture[cite: 4]. Weaver scans the host filesystem for `manifest.json` configurations and hot-loads external application bridges (e.g., Unreal Engine 5, DAWs) on the fly via `\pi` namespace routing and a Human-in-the-Loop `ApprovalModal`[cite: 2, 4, 5].
* **Hardware-Level Killswitch:** A dedicated, hardware-polled UI interrupt bound to an `AbortController` that instantly terminates rogue agent workflows[cite: 4].
* **Ollama Daemon Integration:** Real-time local model detection, dynamic VRAM/RAM polling via PowerShell/sysinfo to scale context windows (`num_ctx`) and `keep_alive` timers automatically, and an in-app weight downloader[cite: 4].
* **Rust-Native Workspace Picker:** Secure, backend-driven native OS folder selection (`rfd`) that dynamically reloads workspace trees without exposing host filesystem APIs to the browser context.

---

## 🏗️ Architectural Evolution: v1.0.1 MVP vs. v2.0 Enterprise Target

Weaver was engineered first as a rapid, functional desktop MVP (**v1.0.x**) to validate local multi-agent routing, plugin discovery, and ergonomic IDE workflows. 

To meet the demands of enterprise process optimization and continuous CI/CD automation, Weaver is actively migrating toward a hardened, multi-tiered execution engine (**v2.0**). Below is the transparent breakdown of current MVP boundaries versus the target v2.0 Enterprise Architecture (detailed in [`ARCHITECTURE_V2.md`](ARCHITECTURE_V2.md)):

| Architectural Domain | Current State (v1.1.0 Governance) | v2.0 Enterprise Target Architecture |
| :--- | :--- | :--- |
| **Process & Tool Sandboxing** | **IPC-Gated Host I/O:** File I/O is routed through Rust and cryptographically audited, but external shell commands are not containerized. | **Dual-Tier Isolation:** Embedded **Wasmtime (WASI)** and rootless **OCI Containers (`bollard`)**. |
| **Orchestration Topology** | **Monolithic Desktop State:** Orchestration loop and state management (`useAgentStore`) execute inside the Tauri desktop lifecycle. | **Hexagonal Daemon (`weaver-daemon`):** Pure-Rust core exposing **gRPC (`tonic`)** and **RabbitMQ** consumers for CI/CD pipelines. |
| **Auditability & Telemetry** | **Immutable Audit Ledger:** Append-only **SQLite (`sqlx` WAL)** database with SHA-256 Merkle hash-chaining and strict DB-level immutability triggers. | **OpenTelemetry (OTLP):** Export distributed execution spans and audit hashes directly to enterprise SIEM platforms. |
| **Agent Output & Governance** | **Grammar Constraints:** Strict JSON Schema (GBNF) logit-level enforcement and a 4-perspective Review Council evaluation. | **Policy-as-Code:** Embedded **Open Policy Agent (`regorus` OPA/Rego)** RBAC interceptor and a 5th Fidelity Auditor Agent. |

---

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, Wouter, Lucide Icons, Monaco Editor (`@monaco-editor/react`), Vite[cite: 2, 3, 4]
* **Backend:** Rust, Tauri v2 IPC, `rfd` (Native OS Dialogs), `serde` / `serde_json`, local OS file watchers[cite: 4]
* **Inference Engine:** Local Ollama REST API (`localhost:11434`) supporting `llama3.1:8b`, `codestral`, `qwen2.5-coder:7b`, and custom Unsloth/Axolotl GGUF fine-tunes[cite: 2, 4, 5]

---

## ⌨️ Command Terminal Quick Reference
Inside the Weaver Command Terminal, the **Director** routes standard prompts automatically, or you can use backslash commands for deterministic control[cite: 2]:
* `\@<model_name> <prompt>` — Bypass the Director and hot-swap/force a specific local model or agent persona (e.g., `\@codestral` or `\@Steve@Maxwell`)[cite: 2].
* `\pi <namespace>` — Load an installed plugin namespace context (e.g., `ide`, UE5, DAW bridges)[cite: 2, 4].
* `\exit` — Exit the active plugin context[cite: 2].
* `\sys <instructions>` — Update base system instructions with a live `[SYSTEM OVERRIDE]`[cite: 2].
* `\clear` — Clear terminal history[cite: 2].

---

## 📦 Installation & Build

*Note: Future releases will include a Hybrid Smart-Detection Setup Wizard to automatically scan and pull optimized models on first boot.*

**Current Prerequisites:**
1. [Node.js](https://nodejs.org/) (v18+ recommended)
2. [Rust & Cargo](https://www.rust-lang.org/tools/install)
3. [Ollama](https://ollama.ai/) (Running locally)

```bash
ollama pull llama3.1:8b
ollama pull codestral
ollama pull qwen2.5-coder:7b
```

**Development:**
```bash
npm install
npm run tauri dev
```
[cite: 4, 6]

**Build Executable:**
```bash
npm run tauri build
```
[cite: 4, 6]

---

## 📚 Documentation
* [Architecture & Review Council Details](ARCHITECTURE.md)[cite: 4, 6]
* [v2.0 Enterprise Architecture Specification](ARCHITECTURE_V2.md)[cite: 6]
* [Development Roadmap](ROADMAP.md)[cite: 4, 6]
* [Security Doctrine](SECURITY_DOCTRINE.md)[cite: 5, 6]
* [Changelog](CHANGELOG.md)[cite: 4, 6]

## License
Released under the [Apache 2.0 License](LICENSE)[cite: 4, 6].
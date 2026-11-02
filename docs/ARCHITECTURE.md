# Weaver Architecture & Technical Philosophy

Weaver is built to solve the friction of local AI orchestration. Rather than relying on cloud APIs or fragmented CLI tools, Weaver provides an air-gapped, zero-trust environment where highly specialized local LLMs can physically interact with your filesystem, write code, and communicate with external software—safely.

---

## 1. Core Principles
1. **Local First:** No data leaves the machine unless explicitly configured.
2. **Strict IPC Boundary:** The React frontend (presentation layer) has zero native capabilities. All filesystem, shell, native OS dialogs, and hardware executions are ferried through strongly-typed Tauri Rust commands in a strict hexagonal workspace architecture.
3. **Transparent Cognition:** Agent reasoning is separated from conversational UI. A dedicated `Chain of Thought` / `System Trace` panel serializes system events, hardware state, and structured LLM planning into a single chronological trace.

---

## 2. The Multi-Agent Review Council & Semantic Routing

Allowing an autonomous agent to freely edit local files introduces high risk. Weaver mitigates this using a tiered routing and consensus architecture.

### Current State (v1.7.0 Enterprise)
* **The "Director" Router (`llama3.1:8b`):** A lightweight, low-temperature classification layer that intercepts standard user prompts in the Command Palette (`routePrompt`) and dynamically dispatches execution to specialized local models (`codestral` for code generation/editing, `qwen2.5-coder:7b` for critique/debugging, or custom GGUF fine-tunes) while preserving manual `\@model` overrides.
* **Single-Prompt Consensus Model:** To balance latency and safety in the MVP, the active LLM is prompted via a meta-layer to evaluate its own tool call (`edit_local_file`) from four distinct perspectives before execution:
  * **Security:** Are we exposing API keys or enabling arbitrary code execution?
  * **Legal/Compliance:** Does this violate licensing or organizational constraints?
  * **Optimization:** Is the generated code computationally heavy or memory-leaking?
  * **UX:** Does this break the UI/UX contracts of the active module?

### Target State (v2.0+ Heuristic-Routed Multi-Agent DAG)
With Weaver running on a deterministic state-machine pipeline in Rust (`weaver-core`), the Review Council evolves into a formal Directed Acyclic Graph (DAG):
1. **Heuristic Pre-flight (Rust):** Blazing-fast, deterministic checks (Regex for secrets, file-size diffs, AST syntax linting) catch 80% of errors with zero inference cost.
2. **The Router Agent (Ultra-Light LLM):** Reviews the prompt/diff and determines *which* specialized council agents need to be invoked.
3. **The Multi-Perspective Evaluator:** Flagged agents (`codestral`, `qwen2.5-coder`) perform deep validation, returning a grammar-constrained JSON consensus (`Approve`, `Deny`, `Modify`) to the master orchestrator.
4. **The Audit Failsafe (Agent 5 — Fidelity Auditor):** A final, isolated agent dedicated strictly to data loss prevention. It evaluates the blast radius of approved edits against historical codebase context to prevent destructive overwrites or cascading application failures.

---

## 3. State Management & Memory-Optimized Auditing

Weaver utilizes centralized Zustand stores (`useAgentStore`, `usePluginStore`, `useCotStore`) to synchronize state between the multi-tab Monaco IDE and the LLM engine. If a file tab is active in the Monaco Editor, its absolute path (`activeFilePath`) is automatically injected into the LLM's system prompt context window.

To ensure absolute enterprise accountability, Weaver utilizes an **Immutable SQLite Rolling Ledger**:
* **Tamper-Evident Hashing:** Every file edit is intercepted by Rust, where a unified diff is generated. The transaction is hashed via SHA-256, cryptographically chained to the previous ledger entry, and written to SQLite in WAL mode before touching the disk.
* **Database-Level Immutability:** SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers automatically execute a `RAISE(ABORT)` exception, preventing users, rogue agents, or external scripts from covering their tracks.

---

## 4. Enterprise Hardening Blueprint (Active Infrastructure)

To scale Weaver from a single-tenant desktop companion into an enterprise-grade, multi-tiered automation engine, the following migrations are live in the v1.7.0 architecture:

### Priority 1: True Process Sandboxing (Completed)
* **v1.7.0 State:** Dual-tier sandboxing is active. Tier-1 WebAssembly Sandboxing uses `wasmtime` for mapped virtual directories and CPU fuel limits. Tier-2 uses `bollard` for ephemeral, network-isolated Rootless OCI/Podman containers to execute heavy compiler toolchains. Filesystem writes are explicitly staged in `weaver-core`.

### Priority 2: Headless CI/CD Orchestrator (Completed)
* **v1.7.0 State:** Rust execution logic decoupled into a hexagonal Cargo Workspace (`weaver-core`, `weaver-daemon`, `weaver-desktop`). `weaver-daemon` is a standalone background service running via an `axum` HTTP server for non-interactive CI/CD orchestration.

### Priority 3: SIEM Telemetry & Policy Gatekeeping (Completed)
* **v1.7.0 State:** Microsoft's pure-Rust OPA/Rego engine (`regorus`) evaluates tool calls against signed `.rego` policies prior to execution. The entire `weaver-core` layer is instrumented with `tracing-opentelemetry` to export structured spans and SIEM-ready execution metadata.
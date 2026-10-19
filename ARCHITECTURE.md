# Weaver Architecture & Technical Philosophy

Weaver is built to solve the friction of local AI orchestration[cite: 7]. Rather than relying on cloud APIs or fragmented CLI tools, Weaver provides an air-gapped, zero-trust environment where highly specialized local LLMs can physically interact with your filesystem, write code, and communicate with external software—safely[cite: 7].

---

## 1. Core Principles
1. **Local First:** No data leaves the machine unless explicitly configured[cite: 7].
2. **Strict IPC Boundary:** The React frontend (presentation layer) has zero native capabilities[cite: 7]. All filesystem, shell, native OS dialogs, and hardware executions are ferried through strongly-typed Tauri Rust commands[cite: 7].
3. **Transparent Cognition:** Agent reasoning is separated from conversational UI[cite: 7]. A dedicated `Chain of Thought` / `System Trace` panel serializes system events, hardware state, and structured LLM planning into a single chronological trace[cite: 7, 8].

---

## 2. The Multi-Agent Review Council & Semantic Routing

Allowing an autonomous agent to freely edit local files introduces high risk[cite: 7]. Weaver mitigates this using a tiered routing and consensus architecture[cite: 7].

### Current State (v1.0.1 MVP)
* **The "Director" Router (`llama3.1:8b`):** A lightweight, low-temperature classification layer that intercepts standard user prompts in the Command Palette (`routePrompt`) and dynamically dispatches execution to specialized local models (`codestral` for code generation/editing, `qwen2.5-coder:7b` for critique/debugging, or custom GGUF fine-tunes) while preserving manual `\@model` overrides[cite: 2].
* **Single-Prompt Consensus Model:** To balance latency and safety in the MVP, the active LLM is prompted via a meta-layer to evaluate its own tool call (`edit_local_file`) from four distinct perspectives before execution[cite: 2, 7]:
  * **Security:** Are we exposing API keys or enabling arbitrary code execution[cite: 7]?
  * **Legal/Compliance:** Does this violate licensing or organizational constraints[cite: 7]?
  * **Optimization:** Is the generated code computationally heavy or memory-leaking[cite: 7]?
  * **UX:** Does this break the UI/UX contracts of the active module[cite: 7]?

### Target State (v2.0+ Heuristic-Routed Multi-Agent DAG)
As Weaver transitions to a deterministic state-machine pipeline in Rust (`weaver-core`), the Review Council evolves into a formal Directed Acyclic Graph (DAG)[cite: 7]:
1. **Heuristic Pre-flight (Rust):** Blazing-fast, deterministic checks (Regex for secrets, file-size diffs, AST syntax linting) catch 80% of errors with zero inference cost[cite: 7].
2. **The Router Agent (Ultra-Light LLM):** Reviews the prompt/diff and determines *which* specialized council agents need to be invoked[cite: 7].
3. **The Multi-Perspective Evaluator:** Flagged agents (`codestral`, `qwen2.5-coder`) perform deep validation, returning a grammar-constrained JSON consensus (`Approve`, `Deny`, `Modify`) to the master orchestrator[cite: 7].
4. **The Audit Failsafe (Agent 5 — Fidelity Auditor):** A final, isolated agent dedicated strictly to data loss prevention[cite: 7]. It evaluates the blast radius of approved edits against historical codebase context to prevent destructive overwrites or cascading application failures[cite: 7].

---

## 3. State Management & Memory-Optimized Auditing

Weaver utilizes centralized Zustand stores (`useAgentStore`, `usePluginStore`, `useCotStore`) to synchronize state between the multi-tab Monaco IDE and the LLM engine. If a file tab is active in the Monaco Editor, its absolute path (`activeFilePath`) is automatically injected into the LLM's system prompt context window.

To ensure absolute enterprise accountability, Weaver utilizes an **Immutable SQLite Rolling Ledger**:
* **Tamper-Evident Hashing:** Every file edit is intercepted by Rust, where a unified diff is generated. The transaction is hashed via SHA-256, cryptographically chained to the previous ledger entry, and written to SQLite in WAL mode before touching the disk.
* **Database-Level Immutability:** SQLite `BEFORE UPDATE` and `BEFORE DELETE` triggers automatically execute a `RAISE(ABORT)` exception, preventing users, rogue agents, or external scripts from covering their tracks.

---

## 4. Enterprise Hardening Blueprint (v2.0 Specification)

To scale Weaver from a single-tenant desktop companion into an enterprise-grade, multi-tiered automation engine, development is anchored to the remaining architectural migrations:

### Priority 1: True Process Sandboxing
* **v1.1.0 Baseline Gap:** File I/O and OS folder pickers are gated behind Tauri Rust IPC, and all edits are cryptographically audited. However, host shell invocations (`std::process::Command`) lack container-level isolation.
* **v2.0 Target Solution:** Embed `wasmtime` (WASI Preview 2) for script execution and `bollard` (Rootless OCI/Podman) for compiler toolchains. Transition to an isolated backend staging tree that verifies code before committing to Monaco.

### Priority 2: Headless CI/CD Orchestrator
* **v1.1.0 Baseline Gap:** Orchestration logic and state reside inside the React WebView, preventing headless execution in CI/CD pipelines.
* **v2.0 Target Solution:** Refactor the Rust backend into a hexagonal Cargo Workspace (`weaver-core`, `weaver-daemon`, `weaver-desktop`) utilizing `tonic` (gRPC) and `lapin` (RabbitMQ) for non-interactive job consumption.

### Priority 3: SIEM Telemetry & Policy Gatekeeping
* **v1.1.0 Baseline Gap:** While JSON Schema logit-constraints (GBNF) force structural compliance, we lack deterministic RBAC policy evaluation before execution. 
* **v2.0 Target Solution:** Embed Microsoft's pure-Rust OPA/Rego engine (`regorus`) to evaluate tool calls against signed `.rego` policies. Instrument `weaver-core` with OpenTelemetry (OTLP) to stream execution spans and audit hashes to external SIEM platforms.
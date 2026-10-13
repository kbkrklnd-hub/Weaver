# Weaver Architecture & Technical Philosophy

Weaver is built to solve the friction of local AI orchestration. Rather than relying on cloud APIs or fragmented CLI tools, Weaver provides an air-gapped, zero-trust environment where highly specialized local LLMs can physically interact with your filesystem, write code, and communicate with external software—safely.

## Core Principles
1. **Local First:** No data leaves the machine unless explicitly configured.
2. **Strict IPC Boundary:** The React frontend (presentation layer) has zero native capabilities. All filesystem, shell, and hardware executions are ferried through strongly-typed Tauri Rust commands.
3. **Transparent Cognition:** Agent reasoning is separated from conversational UI. A dedicated `Chain of Thought` panel serializes system events, hardware state, and XML-tagged LLM planning into a single chronological trace.

## The Multi-Agent Review Council (Evolutionary Architecture)

Allowing an autonomous agent to freely edit local files introduces high risk. Weaver mitigates this using a "Review Council." 

### Current State (MVP)
For v1.0.0, Weaver utilizes a **Single-Prompt Consensus Model** to balance latency and safety. Before an edit is executed, the LLM is prompted via a meta-layer to evaluate its own tool call from distinct perspectives:
*   **Security:** Are we exposing API keys or enabling arbitrary code execution?
*   **Legal/Compliance:** Does this violate licensing or organizational constraints?
*   **Optimization:** Is the generated code computationally heavy or memory-leaking?
*   **UX:** Does this break the UI/UX contracts of the active module?

### Future State (v2.0+)
As local inference speeds improve, Weaver will transition to a **Heuristic-Routed Multi-Agent Pipeline**:
1. **Heuristic Pre-flight (Rust/TS):** Blazing-fast, hardcoded checks (Regex for secrets, file-size diffs, syntax linting) catch 80% of errors with zero inference cost.
2. **The Router Agent (Ultra-Light LLM):** A fast, small-parameter model (e.g., Qwen 1.5B) acts as a triage nurse. It reviews the proposed diff and determines *which* of the specialized council agents actually need to be invoked.
3. **The Multi-Perspective Evaluator:** The specific agent(s) flagged by the router perform a deep validation, returning a strict JSON consensus (Approve, Deny, Modify) to the master orchestrator.
4. **The Audit Failsafe (Agent 5):** A final, isolated agent dedicated strictly to data loss prevention. It evaluates the blast radius of the approved edits against historical codebase context to prevent destructive overwrites or cascading application failures.

## State Management & Memory-Optimized Auditing
Weaver utilizes a centralized Zustand store (`AgentStore`) to synchronize state between the IDE and the LLM engine. This eliminates split-brain scenarios; if a file is active in the Monaco Editor, its absolute path is instantly injected into the LLM's system prompt context window.

To ensure long-term accountability without exhausting host system memory, Weaver's post-MVP architecture includes a local **SQLite Rolling Ledger**:
*   **30-Day Ephemeral Log:** Captures the high-volume Chain of Thought telemetry and system trace events.
*   **6-Month Immutable Ledger:** Stores compressed delta-diffs of every file edit, tool call, and agent action executed on the machine, guaranteeing that historical data loss can always be reconstructed and reversed.
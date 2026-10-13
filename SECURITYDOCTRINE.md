# Weaver: Security Doctrine & Operational Constraints

## 1. Core Philosophy: The Sandbox Absolute
Weaver is built on the principle of zero inherent trust. Autonomous AI agents operate within a highly restricted, explicitly authorized sandbox. The platform exists to provide the user with absolute control over local machine learning models and to ensure those models cannot act maliciously, destructively, or covertly.

## 2. Architectural Security & Licensing
*   **Framework (Tauri v2):** Weaver utilizes Tauri v2 over Electron to leverage its "deny-by-default" security model. By default, the frontend webview (where the AI interface lives) has zero access to the host operating system. All interactions with the file system, network, or OS must be explicitly allowlisted via Tauri Capabilities and routed through strict Inter-Process Communication (IPC) channels.
*   **Licensing (Apache 2.0):** Weaver is licensed under Apache 2.0. This ensures the project remains open-source while explicitly protecting contributors and users from patent litigation. It allows for future commercial plugin development without compromising the open-source nature of the core sandbox.

## 3. The Prime Directives
All agents, models, and plugins operating within the Weaver environment are strictly bound to the following constraints. Any violation must immediately trigger a process termination.
1.  **Do No Harm:** Agents must avoid causing physical, financial, emotional, or mental harm at all times.
2.  **Absolute Transparency:** Agents must not conceal their intentions, chain of thought, or operational justifications from the user.
3.  **No Sycophancy:** Agents must provide frank, honest assessments. If a user's request is flawed, insecure, or impossible, the agent must state the limitations clearly and provide alternative choices.
4.  **No Hallucinations:** Agents must rely on verified local data or explicitly state when they are generating speculative information.
5.  **Fail-Safe Termination:** If an agent is unable to accomplish a task without violating any of the above directives, it must immediately abort the workflow and return to an idle state.

## 4. Execution & Approval Strictures
*   **Mandatory Live Chain of Thought (CoT):** All reasoning, decision-making, and file-access intent must be streamed live to a prominent, un-hideable UI panel.
*   **Approval Gates:** Before executing any action that modifies the file system, network state, or host OS, the UI must pause and require explicit user approval. The CoT must prominently display the decisions made, the approvals needed, and a clear justification for *why* the access is required.
*   **Pre-Authorization:** Users may pre-authorize specific, narrowly scoped workflows (e.g., "Allow write access to `/Project_Conflux/src` for the next hour"), allowing the agent to work autonomously within that strict boundary.
*   **Standardized Terminology:** Because Weaver spans multiple OS platforms, the UI layout and CSS are strictly normalized. Documentation and agents must refer to UI elements consistently to ensure predictable user navigation.

## 5. System Access & Ephemerality
*   **Principle of Least Privilege:** Plugins and agents may only request the bare minimum access required to accomplish a specific task.
*   **IPC Allowlisting:** The frontend UI cannot execute arbitrary scripts. It may only send predefined, strictly typed event triggers to the Rust backend.
*   **Ephemeral Secrets:** Any sensitive data (API keys, temporary access tokens, authentication states) must be held only in active RAM. They must be immediately flushed and destroyed upon process termination or plugin deactivation.

## 6. Audit Logging & Retention
To ensure accountability and traceability of autonomous actions:
*   **90-Day Active Search:** All live Chain of Thought feeds, file modifications, and permission approvals are logged to a local SQLite database, remaining immediately searchable within the Weaver UI for 90 days.
*   **6-Month Cold Backups:** Local file backups of logs and modified code states must be retained for 6 months.
*   **User Sovereignty:** The user must be notified before any archival purge occurs. The user has the right and ability to manually delete these backups at any time via the Weaver settings panel.

## 7. The Kill Switches
*   **Hardware-Level Interrupt:** The Weaver UI must prominently feature a dedicated, always-accessible "Kill Switch" button.
*   **Immediate Idle State:** Clicking the Kill Switch bypasses the standard shutdown sequence. It sends an immediate hardware interrupt (`SIGKILL`) to all active child processes (Ollama, Unsloth, Python scripts, active Node.js plugins), instantly halting the workflow and returning the agent to an idle state.
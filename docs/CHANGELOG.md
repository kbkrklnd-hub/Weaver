// Zero-trust patch successful
document_id: "WV-DOC-004"
title: "Project Changelog"
version: "1.7.0"
status: "active"
author: "Octave Labs Core"
created_date: "2026-10-09"
last_updated: "2026-11-01"
license: "Apache-2.0"
framework_target: "Tauri v2"
security_tier: "tier-0"
changelog_ref: "CHANGELOG.md"
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
- **Unsloth/Axolotl Integration:** Direct IDE hooks for local fine-tuning.
- **Slack Webhook Plugin:** Real-time event notifications bridging daemon outputs to Slack channels.

---

## [1.7.0] - 2026-11-01 (The Enterprise Architecture & Phase 6 Release)

### Added
- **Completed Phase 6 Launch Deliverables:** Finalized executable packaging pipeline (`npm run tauri build`), integrated the hybrid smart-detection Ollama setup wizard on first boot, and published API developer guides.
- **Hexagonal Workspace:** Completely decoupled the Rust engine from the React Tauri UI into a 3-crate Cargo workspace (`weaver-desktop`, `weaver-core`, `weaver-daemon`)[cite: 3, 4, 6].
- **Headless Daemon:** Shipped `weaver-daemon` powered by an Axum HTTP server (`127.0.0.1:3030`) to allow headless CI/CD execution and autonomous agents without the desktop GUI[cite: 3, 4, 6].
- **OCI Container Execution:** Integrated `bollard` (v0.21.1) to spin up ephemeral, network-isolated (`network_mode: "none"`) Podman/Docker containers for heavy compiler toolchains[cite: 3, 4, 6].
- **Staged Patching:** Ripped file-writing privileges out of the frontend. All modifications now run through `validate_and_stage_patch` in the pure-Rust backend.
- **OpenTelemetry Pipeline:** Instrumented `weaver-core` with the `tracing` and `tracing-subscriber` crates to provide thread-aware, environment-filtered execution spans for SIEM platforms[cite: 3, 4, 6].

---

## [1.2.0] - 2026-11-01 (The Sandboxing Update)

### Added
- **Enterprise Guardrails:** `regorus` OPA policy-as-code integration for deterministic RBAC file-path blacklisting[cite: 3, 4, 6].
- **WASI Sandboxing:** Execution of agent scripts in isolated WebAssembly runtimes using `wasmtime` and `wasi-cap-std-sync`, enforcing strictly mapped virtual directories[cite: 3, 4, 6].

---

## [1.1.0] - 2026-10-18 (The Governance Update)

### Added
- **Immutable SQLite Audit Ledger:** Implemented an embedded SQLite database in WAL mode (`weaver_audit.db`) that cryptographically records all agent file modifications[cite: 4, 6].
- **Merkle Hash-Chaining:** All file patches now compute a unified diff (`similar`) and a SHA-256 cryptographic hash chaining back to the previous transaction, ensuring tamper-evident enterprise accountability[cite: 4, 6].
- **Database-Level Immutability:** Enforced append-only architecture via `BEFORE UPDATE` and `BEFORE DELETE` `RAISE(ABORT)` triggers at the SQLite level[cite: 4, 6].
- **Grammar-Constrained Outputs (GBNF):** Replaced fragile XML tag scraping with strict JSON Schema formatting, locking the Ollama LLM sampler to output mathematically valid `StructuredAgentResponse` objects containing the Chain of Thought, Review Council consensus, and tool payloads[cite: 4, 6].
- **Dynamic Model Discovery:** Eliminated hardcoded models in the Command Palette; the UI now dynamically queries `GET /api/tags` on boot to populate available local models[cite: 4, 6].

---

## [1.0.1] - 2026-10-15

### Added
- **Multi-Tab IDE Engine:** Upgraded `useAgentStore` and `WeaverIDE.tsx` with a VS Code-style `openFiles` tab array, active tab state persistence, automatic fallback tab selection on close, and unsaved/active visual indicators[cite: 3, 4, 6].
- **Autonomous "Director" Semantic Router:** Implemented `routePrompt` in `src/services/ollama.ts` using `llama3.1:8b` (`format: "json"`, `temperature: 0.1`) to automatically classify user intent and dynamically dispatch prompts to specialized local models (`codestral:latest`, `qwen2.5-coder:latest`)[cite: 2, 3, 4, 6].
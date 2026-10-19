---
document_id: "WV-DOC-004"
title: "Project Changelog"
version: "1.1.0"
status: "active"
author: "Octave Labs Core"
created_date: "2026-10-09"
last_updated: "2026-10-18"
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
- **Enterprise Guardrails:** `regorus` OPA policy-as-code integration for deterministic RBAC file-path blacklisting.
- **WASI Sandboxing:** Execution of agent scripts in isolated WebAssembly runtimes.
- **Installer:** Executable installer packaging via Tauri build pipeline.

---

## [1.1.0] - 2026-10-18 (The Governance Update)

### Added
- **Immutable SQLite Audit Ledger:** Implemented an embedded SQLite database in WAL mode (`weaver_audit.db`) that cryptographically records all agent file modifications.
- **Merkle Hash-Chaining:** All file patches now compute a unified diff (`similar`) and a SHA-256 cryptographic hash chaining back to the previous transaction, ensuring tamper-evident enterprise accountability.
- **Database-Level Immutability:** Enforced append-only architecture via `BEFORE UPDATE` and `BEFORE DELETE` `RAISE(ABORT)` triggers at the SQLite level.
- **Grammar-Constrained Outputs (GBNF):** Replaced fragile XML tag scraping with strict JSON Schema formatting, locking the Ollama LLM sampler to output mathematically valid `StructuredAgentResponse` objects containing the Chain of Thought, Review Council consensus, and tool payloads.
- **Dynamic Model Discovery:** Eliminated hardcoded models in the Command Palette; the UI now dynamically queries `GET /api/tags` on boot to populate available local models.

---

## [1.0.1] - 2026-10-15

### Added
- **Multi-Tab IDE Engine:** Upgraded `useAgentStore` and `WeaverIDE.tsx` with a VS Code-style `openFiles` tab array, active tab state persistence, automatic fallback tab selection on close, and unsaved/active visual indicators.
- **Autonomous "Director" Semantic Router:** Implemented `routePrompt` in `src/services/ollama.ts` using `llama3.1:8b` (`format: "json"`, `temperature: 0.1`) to automatically classify user intent and dynamically dispatch prompts to specialized local models (`codestral:latest`, `qwen2.5-coder:7b`, `llama3.1:8b`) while preserving manual `\@model` and `\sys` overrides in `CommandPalette.tsx`.
- **Secure Rust-Native Workspace Picker:** Added `pick_workspace_dialog` command in `src-tauri/src/lib.rs` using the `rfd` (v0.16) crate. Allows dynamic workspace directory switching from the UI while strictly preserving the zero-trust React-to-Rust IPC boundary (no frontend dialog APIs exposed).
- **Interactive IDE Toolbar Menus:** Built stateful `File`, `Edit`, and `View` dropdown menus in `WeaverIDE.tsx` with click-away listeners, wired directly to Monaco editor actions (`undo`, `redo`, `cut`, `copy`, `paste`, `find`, `quickCommand`) and workspace layout toggles (Explorer sidebar visibility and Word Wrap).

### Fixed
- **Monaco XML & Plaintext Linter Fallback:** Added explicit `.xml` syntax highlighting support in `getLanguage` and changed the default unrecognized file fallback from `javascript` to `plaintext`, eliminating false-positive TypeScript/JS syntax error squiggles on Repomix outputs and raw text logs.

---

## [1.0.0] - 2026-10-14
*(See previous history in repo for full 1.0.0 and beta release notes)*
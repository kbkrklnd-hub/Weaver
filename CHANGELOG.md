---
document_id: "WV-DOC-004"
title: "Project Changelog"
version: "0.3.0"
status: "active"
author: "Octave Labs Core"
created_date: "2026-10-09"
last_updated: "2026-10-13"
license: "Apache-2.0"
framework_target: "Tauri v2"
security_tier: "tier-0"
changelog_ref: "CHANGELOG.md"
---

# Changelog

All notable changes to this project will be documented in this file[cite: 11].

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)[cite: 11].

## [Unreleased]
- Packaging and executable builds for v1.0.0 MVP portfolio release.

---

## [0.3.0] - 2026-10-13

### Added
- **Global File State Routing:** Elevated `activeFilePath` to the global Zustand `AgentStore` to guarantee the LLM context matches the exact file open in the Monaco editor.
- **Hardened Stream Interceptor:** Implemented an aggressive regex and buffer-trimming parser to ensure `<thought>` and `<action>` XML tags never leak into the Chat Terminal UI.
- **Bottom Status Bar:** Reclaimed vertical workspace by migrating hardware telemetry from the CoT panel into a dedicated, bottom-aligned application status bar.
- **WMI VRAM Bypass:** Updated Rust hardware polling to utilize PowerShell WMI (`Win32_VideoController`) to bypass zeroed AMD performance counters during deep idle states, returning accurate Dedicated Video Memory metrics.

### Changed
- **Unified System Trace:** Stripped the CoT panel of the hardware widget, merging standard system events, security alerts, and live agent cognitive reasoning into a single, chronological scrolling feed.
- **UI Unlocking Guarantee:** Wrapped the primary LLM inference block in a `try...finally` statement to ensure the `isGenerating` lock releases regardless of parsing errors or manual kill-switch aborts.
- **Error Routing:** Diverted tool-call success metrics and command errors from the Chat Terminal to the System Trace to maintain a clean conversational UI.

---

## [0.2.0] - 2026-10-12

### Added
- **Native Directory Scanning:** Implemented `fs_read_dir` in Rust to scan arbitrary host OS directories via Tauri IPC[cite: 11].
- **Dynamic Manifest Discovery:** Upgraded `usePluginStore.ts` to dynamically register plugins via local `manifest.json` files[cite: 11].
- **Zero-Mock Plugin State:** Purged hardcoded mock plugins from the frontend[cite: 11].
- **Dynamic Workspace Manager:** Resolves and mounts workspaces dynamically based on registered plugin namespaces[cite: 11].
- **Architectural Pivot (Core IDE):** Integrated Monaco Editor directly into Weaver's core layer[cite: 11].

### Changed
- **Export Refactoring:** Converted `WorkspaceManager` to a named export to eliminate collisions[cite: 11].

---

## [0.1.0] - 2026-10-09

### Added
- **Project Initialization:** Bootstrapped Weaver with Tauri v2, React, and TypeScript[cite: 11].
- **Dynamic 3-Way Chat Terminal:** Bottom-anchored workspace terminal[cite: 11].
- **Ollama Engine Bridge:** Streaming service communicating with local Ollama REST endpoints[cite: 11].
- **Hardware Telemetry Profiler:** Rust backend `sysinfo` polling to calculate system RAM[cite: 11].
- **IDE Command Palette:** Auto-resizing textarea supporting system commands and model routing[cite: 11].
- **Master Kill Switch:** Hardware-level interrupt bound to an `AbortController`[cite: 11].
- **Security Approval Modal:** Human-in-the-loop interception for sensitive operations[cite: 11].
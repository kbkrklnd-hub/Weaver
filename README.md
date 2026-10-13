# Weaver

**A Local-First, Zero-Trust AI Agent Orchestration IDE**

Weaver is a modular desktop operating system for autonomous workflows. Built on a high-performance **Tauri v2** shell and a **Rust** backend, it provides a hyper-secure, air-gapped environment where specialized local LLMs (via Ollama) can physically interact with your filesystem and write code without compromising host system security.

## 🚀 Core Philosophy
* **100% Local Inference:** No cloud APIs. No data exfiltration. Weaver runs entirely on your local hardware.
* **Strict IPC Security Boundary:** The React presentation layer has zero native capabilities. All execution requests are ferried through strongly-typed, deniable Tauri Rust commands.
* **Transparent Cognition:** Agent reasoning is demystified. A unified System Trace panel serializes system events, hardware telemetry, and XML-tagged LLM planning into a single chronological feed.

## ⚡ Features
* **Native Monaco IDE:** Embedded `@monaco-editor/react` with dynamic global state syncing. The LLM always knows exactly which file you are looking at.
* **Multi-Agent Review Council:** A meta-prompting architecture that forces the LLM to evaluate its own proposed file edits from Security, Legal, Optimization, and UX perspectives before execution.
* **Dynamic Plugin Discovery:** A zero-mock plugin architecture. Weaver scans the host filesystem for `manifest.json` configurations and hot-loads external application bridges (e.g., Unreal Engine 5, DAWs) on the fly.
* **Hardware-Level Killswitch:** A dedicated, hardware-polled UI interrupt bound to an `AbortController` that instantly terminates rogue agent workflows.
* **Ollama Daemon Integration:** Real-time local model detection, dynamic VRAM/RAM polling via PowerShell/sysinfo, and an in-app weight downloader.

## 🛠️ Tech Stack
* **Frontend:** React 18, TypeScript, Tailwind CSS, Zustand, Wouter, Monaco Editor
* **Backend:** Rust, Tauri v2 IPC, local OS file watchers
* **Inference Engine:** Local Ollama REST API (`localhost:11434`)

## 📦 Installation & Build

**Prerequisites:**
1. [Node.js](https://nodejs.org/)
2. [Rust](https://www.rust-lang.org/tools/install)
3. [Ollama](https://ollama.ai/) (Running locally with `OLLAMA_ORIGINS="*"`)

**Development:**
\`\`\`bash
npm install
npm run tauri dev
\`\`\`

**Build Executable:**
\`\`\`bash
npm run tauri build
\`\`\`

## 📚 Documentation
* [Architecture & Review Council Details](ARCHITECTURE.md)
* [Development Roadmap](ROADMAP.md)
* [Changelog](CHANGELOG.md)

## License
Released under the [Apache 2.0 License](LICENSE).
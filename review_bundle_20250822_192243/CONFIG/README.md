# The Steward

A local-first AI coordination system that routes tasks to the best available model — GPT-4, Claude, Perplexity, or local LLMs like SmolLM3 — using a user-defined **character sheet**.

Optionally integrates with [n8n](https://n8n.io) and its Model Context Protocol (MCP) to turn AI outputs into automated workflows.

---

## 🔧 Features

- **Character-Sheet Driven**: Define tone, routing logic, memory use, and preferred models via YAML.
- **Local-First Routing**: SmolLM3 can act as a router or fallback model (via `llama.cpp`).
- **Task Type Detection**: Smart routing via rules or local model feedback.
- **CLI Interface**: Input task → get response → log or trigger workflow.
- **Web Interface**: React app with responsive design and PWA capabilities.
- **Smart Routing Visualization**: Real-time display of routing decisions and cognitive analysis.
- **Automation Bridge**: Sends validated workflow specs to n8n via MCP.
- **Scoped Memory**: Optional memory blocks per project or loadout.
- **AI Collaboration Protocol**: 3-way system with ChatGPT (Planner), Copilot (Builder), and Human (Owner).

---

## 🗂 Project Structure

```bash
The-Steward/
├── steward.js                 # Main CLI agent
├── character-sheet.yaml       # Core config
├── loadouts/                  # Optional config variants
├── models/                    # GPT, Claude, SmolLM3 wrappers
├── routing.js                 # Task type → model logic
├── logs/                      # Routing history, feedback
├── web-interface/             # React web app and API server
│   ├── backend/               # Node.js Express API
│   ├── frontend/              # React PWA interface
│   └── README.md              # Web interface documentation
├── .github/
│   └── ai-collab-log.md       # Copilot + ChatGPT collaboration log
├── Custom Instructions - ChatGPT.md
├── Custom Instructions - Copilot.md
└── README.md
```

---

## 🚀 Quick Start

git clone https://github.com/your-username/The-Steward.git
cd The-Steward
npm install

# Run a task
node steward.js "Summarize this article about AI governance." --loadout sqa_mode

---

## 🤝 AI Collaboration Protocol

This project follows a documented Three-Way Collaboration Agreement:

| **Role**       | **Responsibility**     |
| -------------- | ---------------------- |
| Human          | Owns vision, final say |
| ChatGPT        | Planner + Strategist   |
| GitHub Copilot | Builder + Reviewer     |

All code changes are reviewed by both AIs and logged. Disagreements or uncertainty are escalated to the Project Owner.

---

## 📡 Model Routing (Initial Defaults)

| **Task Type** | **Preferred Model** |
| ------------- | ------------------- |
| write         | GPT-4               |
| summarize     | Claude              |
| route         | SmolLM3             |
| debug         | GPT-4               |
| research      | Perplexity          |
| fallback      | SmolLM3             |

Character sheet preferences may override these defaults.

---

## 📦 Dependencies

- Node.js (yargs, js-yaml, dotenv)
- llama.cpp running locally
- API keys for OpenAI, Claude, Gemini, Perplexity
- Docker + n8n (for MCP workflows)

---

## 🧠 Design Values

- **Modular** -- routing, memory, models are all swappable
- **Transparent** -- logs decisions and lets you override
- **Local-First** -- prioritizes privacy, speed, and control
- **Configurable** -- YAML-driven behavior, not hardcoded logic

---

## 🔭 Roadmap (from Project Plan v1)

- Phase 1: Character Sheet + SmolLM3 + n8n
- Phase 2: CLI MVP + Task Routing + MCP Bridge
- Phase 3: Scoped Memory + Feedback Logging
- Phase 4: GUI (optional), Desktop integration, File triggers

---

## 🧩 Future Ideas

Logged in the 🔖 Backlog (not implemented until prioritized).

---

## 📜 License

Personal project -- no license yet.

---

# Changelog – The Steward

## [v1.0.0] – Initial CLI MVP Release
**Released:** 2025-07-21

### 🚀 Features
- CLI interface with task routing and model selection
- YAML-driven character sheet and loadouts
- Rule-based routing system with fallback
- SmolLM3 meta-routing (via Ollama)
- Real model integration: GPT-4, Claude, Perplexity, SmolLM3
- Local model support via Ollama (mistral, codellama, devstral, llama)
- Model metadata tiering via models.yaml
- Manual overrides: `--prefer-tier`, `--use-case`, `--loadout`
- Project memory injection via `memory/` directory
- Output formatting for MCP (`--mcp`)
- Trigger automation via `--send-mcp` to n8n
- Task-level logging and feedback capture (`👍 / 👎 / 🤔`)
- Modular, inspectable structure for future expansion

### 🧱 Internal Modules
- `models/`: All cloud/local model handlers
- `routing.js`: Task type detection + model rules
- `smol-router.js`: Local meta-routing using SmolLM3
- `model-metadata.js`: Tiered model selection helpers
- `logger.js`: Logs task, feedback, and routing info
- `memory.js`: Scoped memory loader/writer
- `mcp-bridge.js`: Formats and sends MCP output

---

## 🔜 Next
- Phase 4: GUI (Electron/Tauri), Alfred/Raycast triggers, live file monitoring
- Route editor, loadout switcher, memory browser

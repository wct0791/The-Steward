# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# Steward Design Validation: Perplexity Research Review
**Date:** 2025-07-22
**Source:** Perplexity AI
**Purpose:** Formal research and design support for The Steward architecture and CLI tool

## 🔍 Summary

Perplexity was invited as a research strategist to validate and extend core architectural and usability choices for The Steward. The response provided:

- Confirmed MAS (Multi-Agent Systems) design matches The Steward’s task delegation model
- Cited support for Human-in-the-Loop design with flexible automation thresholds
- Recommended pre-generation routing strategies based on content, cost, latency, sensitivity
- Suggested Task Object criteria and benchmark resources (RouterBench, Arch-Router)
- Clarified n8n MCP architecture (SSE-based agent orchestration)
- Gave best practices from CLI tool patterns (Git, Docker, jq)

## 🧠 Key Design Confirmations

- **Routing via content/sensitivity/task-type is well-supported in literature**
- **Adapter-based model API layer matches industry approaches**
- **MCP patterns align with modular workflow control**
- **Dry-run and inspectable CLI config are critical usability needs**
- **Human mediation should be treated as a permanent strategic role, not a stopgap**

## 📚 Key Citations
- LangGraph, Arch-Router, RouterBench
- n8n-MCP libraries + GitHub repo
- CLI tooling best practices from Atlan, Toolify, and CommandBox
- HITL frameworks in security and automation (HCHAC, Unified HITL papers)

## 🏁 Outcome

The Steward’s core philosophy — deterministic, transparent routing with human arbitration and local-first fallback — is now supported across:
- Systems design (Gemini)
- Strategic clarity (Claude)
- Research literature and benchmarks (Perplexity)

Next step: map this research into specific test cases and CLI scaffold.

***

# 🧭 The Steward – Vision Log
**Captured:** 2025-07-22
**Status:** Exploratory
**Type:** Long-term conceptual design

---

## Why The Steward Exists

Modern AI tools are trapped in ephemeral chat UIs with no memory, limited context, and no real access to where the user's work and life actually happen.

> **Goal:** Build a local-first, trustable AI coordination system that earns context and capabilities over time—without compromising privacy, agency, or control.

---

## The Problem with Most AI Tools

- Only remember what you tell them in the current session
- Don't understand your workflows, habits, or systems
- Can't act on your behalf without leaking data or making mistakes
- Treat you like a generic user, not a specific human with goals

---

## What The Steward Aims to Be

- **A context-aware assistant** that remembers only what it needs
- **A permissioned task router** that chooses when to invoke local vs. cloud models
- **A privacy-first gatekeeper** that protects your data by default
- **An evolving co-pilot** that earns access to more tools/systems as it proves itself

---

## Roadmap of Trust

### Phase 1 – Scoped CLI Assistant (Today)
- Character sheet defines model preferences, tone, sensitivity
- Local memory logs recall recent tasks per loadout/project
- MCP output enables safe automation via n8n

### Phase 2 – Proactive Routing + Feedback Loops
- Memory writes include success/failure tags
- Optional recall influences routing decisions
- GUI exposes task history + routing rationale

### Phase 3 – Earned Autonomy
- Steward can:
  - Suggest a task queue
  - Retry failed routes
  - Manage automation scaffolds via n8n
- Access tied to approval + performance logs

### Phase 4 – Ambient Agent
- Tie into **Home Assistant** or local services:
  - Modify environment based on task type
  - Auto-adjust presence, music, notifications
  - Create home/office “focus modes”
- Delegate light device control (if allowed) based on loadout settings

---

## Future Design Values

- ✳️ **Context ≠ Surveillance**
  Only retain what's relevant, discard what's not.

- ✳️ **Memory ≠ Manipulation**
  Memory is visible, editable, permissioned.

- ✳️ **Proactivity ≠ Intrusion**
  Steward offers nudges only when earned.

- ✳️ **Local ≠ Isolated**
  Steward bridges your tools safely, not in silos.

---

## Open Questions

- How do we model trust progression in a local system?
- Can we build modular permissions by project/loadout/task type?
- How can we build a “journal input” mode that supports dictation-style reflection without over-logging?

---

## Logged From:
Conversation with ChatGPT on July 22, 2025
(Transcript captured and summarized for archival)



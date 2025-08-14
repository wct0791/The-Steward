# The Steward - Master Document v3
**Version:** 3.0  
**Last Updated:** July 28, 2025  
**Status:** Active Development

-----
## Executive Summary

The Steward is a local-first AI coordination system that intelligently routes tasks to the most appropriate AI model (local or cloud-based) based on user-defined preferences, context, and task requirements. It serves as a privacy-conscious intermediary that reduces direct API usage while maintaining conversation context through persistent memory.

**Core Value Proposition:** Transform disconnected AI interactions into a coherent, context-aware workflow that learns preferences, preserves privacy, and optimizes resource usage.

-----
## Project Vision

### The Problem

Modern AI tools are trapped in ephemeral chat UIs with no memory, limited context, and no real access to where users’ work and life actually happen. They treat users as generic entities rather than specific humans with goals, preferences, and workflows.

### The Solution

Build a local-first, trustable AI coordination system that:
- **Remembers context** across sessions and projects
- **Routes intelligently** between local and cloud models
- **Protects privacy** by default with configurable boundaries
- **Learns preferences** without compromising user agency
- **Integrates workflows** through automation bridges

### Long-term Vision: Roadmap of Trust

**Phase 1 - Scoped CLI Assistant** (Current)
- Character sheet-driven routing and preferences
- Local memory with project/loadout scoping
- MCP integration for safe automation

**Phase 2 - Proactive Routing** (Next)
- Feedback-driven routing optimization
- Usage pattern learning
- Enhanced memory with narrative summaries

**Phase 3 - Earned Autonomy** (Future)
- Suggested task queues and workflows
- Automated retry and error recovery
- Performance-based trust progression

**Phase 4 - Ambient Agent** (Vision)
- Home automation integration
- Environmental awareness and adaptation
- Predictive context switching

-----
## Current Architecture

### Core Components

#### 1. Routing Engine

- **Task Classification:** Analyzes input to determine optimal model
- **Model Selection:** Routes based on character sheet preferences, task type, and context
- **Fallback Logic:** Graceful degradation from cloud to local models
- **Performance Tracking:** Logs routing decisions and outcomes

#### 2. Memory System (MCP-based)

- **Knowledge Graph:** Persistent entity-relationship storage
- **Project Scoping:** Memory compartments by loadout/project
- **Session Continuity:** Context preservation across conversations
- **User Control:** Toggle memory on/off with manual override

#### 3. Model Integrations

- **Cloud Models:** GPT-4, Claude, Gemini, Perplexity (via APIs)
- **Local Models:** SmolLM3, Mistral (via Docker containers)
- **Fallback Options:** llama.cpp integration for offline scenarios

#### 4. Automation Bridge

- **MCP Integration:** n8n Model Context Protocol for workflow automation
- **Task Validation:** Safety checks before automation execution
- **Audit Trail:** Complete logging of automated actions

### Technical Stack

**Core Runtime:**
- Node.js with JavaScript-first scripting
- Docker containers for local model hosting
- MCP (Model Context Protocol) for memory persistence

**Development Environment:**
- VSCode with GitHub Copilot integration
- Four-Way AI Collaboration Agreement for team coordination
- Character sheet-driven configuration

**Future GUI Stack:**
- React + Vite frontend
- Tailwind CSS for styling
- Node.js/Express backend
- Mobile-responsive design

-----
## Character Sheet Integration

The system is driven by a YAML character sheet that defines:

### User Preferences

- Communication style (direct, markdown-friendly, ADHD-aware)
- Output formatting preferences
- Verbosity and tone settings
- Technical skill level and learning goals

### Model Routing Rules

- Task-specific model preferences (write→GPT-4, debug→Claude, etc.)
- Fallback behavior for cloud failures
- Memory usage patterns by loadout
- Sensitivity and privacy boundaries

### Loadout System

Dynamic configuration profiles that modify behavior:
- **Creative:** Conversational tone, memory off, GPT-4 preferred
- **SQA Mode:** Technical focus, project memory on, Claude preferred
- **Frugal Mode:** Local models only, minimal tokens, memory off
- **Research Mode:** Perplexity preferred, browsing tools enabled

-----
## Development Status

### Completed Infrastructure (Phase 1)

- Character sheet YAML configuration
- SmolLM3 and Mistral local model installation
- Docker-based model hosting with auto-start
- MCP memory system with knowledge graph
- Four-Way AI Collaboration Agreement (v1.1.1) 
- Critical infrastructure fixes and operational validation

### Current Development (Phase 2-3)

**Phase 2: MVP Routing + MCP Bridge**
*Target: Aug 8*
- CLI-based routing implementation
- Model integration layer
- Routing decision logging
- Basic automation bridge

 **Phase 3: Validation & Enhancement**
 *Target: Aug 18*
- End-to-end testing and optimization
- Advanced memory features
- Enhanced error handling
- Smart routing improvements

 **Phase 4: GUI & Polish**
 *Target: Aug 30*
- React dashboard interface
- Real-time model monitoring
- Memory browser for knowledge graph
- Configuration management UI

-----
## Design Principles

### Technical Architecture

- **Local-first:** Prefer local models, graceful cloud fallback
- **Config-driven:** No hardcoded behavior, everything configurable
- **Modular:** Components can be developed and tested independently
- **Transparent:** All routing decisions logged and auditable

### User Experience

- **Privacy-protective:** User controls what is remembered and shared
- **Context-aware:** Maintains relevant context without surveillance
- **Performance-focused:** Optimizes for speed and resource efficiency
- **Learning-enabled:** Adapts to usage patterns over time

### Development Workflow

- **Collaboration Agreement:** Structured AI team coordination
- **Gate Checkpoints:** Feasibility, readiness, and integration reviews
- **Timeboxed Sprints:** 30-60 minute focused development sessions
- **Quality Gates:** Claude technical review for all implementations

-----
## Future Enhancements (Backlog)

### Short-term Additions

- **Hybrid Model Hierarchy:** Tiered local model selection (SmolLM3 → Mistral → Gemma)
- **ChatGPT UI Integration:** Bypass API limits via desktop app automation
- **Adaptive Learning:** Preference refinement based on usage patterns

### Medium-term Features

- **Personality-based Routing:** MBTI/Big Five integration for model selection
- **Passive Usage Logging:** Cross-application AI interaction tracking
- **Voice Integration:** Dictation and transcription capabilities
### Long-term Vision

- **Home Automation Integration:** Smart home coordination and ambient awareness
- **Multi-user Support:** Shared contexts with privacy boundaries
- **Team Collaboration:** Shared loadouts and workflow templates

-----
## Success Metrics

### Operational Success

- **Functionality:** Successful task routing to appropriate models
- **Reliability:** System survives reboots and maintains state
- **Performance:** Sub-second routing decisions, efficient resource usage
- **Transparency:** Clear audit trail of all decisions

### User Experience Success

- **Reduced Friction:** Eliminated context re-establishment overhead
- **Improved Outcomes:** Better task completion through smart routing
- **Learning Acceleration:** Faster skill development through optimized workflows
- **Privacy Confidence:** User trust in data handling and memory management

### Development Success

- **Code Quality:** Maintainable, well-documented, modular architecture
- **Collaboration Effectiveness:** Smooth AI team coordination
- **Extensibility:** Easy addition of new models and features
- **Community Value:** Reusable patterns for other AI coordination projects

-----
## Getting Started

### Prerequisites

- Node.js and npm installed
- Docker Desktop for local model hosting
- API keys for preferred cloud models
- Character sheet configuration completed

### Quick Start

1. Clone project repository to local development environment
2. Configure character sheet with personal preferences and API keys
3. Start Docker containers for local models
4. Initialize MCP memory system
5. Run first routing test with simple task

### Development Environment

- Primary IDE: VSCode with Copilot integration
- Testing: Local CLI with manual verification
- Collaboration: Four-Way AI Agreement protocols
- Documentation: Markdown-first with embedded examples

-----
## Technical Implementation Notes

### File Organization

```
steward/
├── cli/        # Command-line interface
├── models/     # Model configuration & handlers
├── memory/     # MCP-based persistence layer
├── loadouts/   # Character sheet & profiles
├── logs/       # Routing & decision audit trail
├── automation/ # n8n/MCP integration bridge
└── web/        # Future GUI application
```
### Configuration Strategy

- Environment variables in `.env` for sensitive data
- YAML configurations for behavior and preferences
- Relative paths for Docker compatibility
- Modular loading system for development flexibility

### Integration Patterns

- REST APIs for model communication
- Event-driven architecture for routing decisions
- Plugin system for extending model support
- Standardized logging for debugging and optimization
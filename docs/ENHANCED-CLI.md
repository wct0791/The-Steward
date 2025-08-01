# The Steward - Enhanced CLI System

## Overview

The enhanced CLI system implements the complete architecture specified in The Steward Master Document, providing intelligent task routing, comprehensive error handling, and seamless integration with memory and automation systems.

## Key Features

### 🎯 Intelligent Task Classification
- **Multi-pattern Recognition**: Sophisticated keyword-based classification with confidence scoring
- **Context Awareness**: Considers multiple signals to determine task intent
- **Confidence Metrics**: Provides transparency into classification certainty

### 🚀 Smart Model Selection
- **Character Sheet Integration**: Routes based on user preferences and loadout configuration
- **Tier-based Routing**: Supports preference for model tiers (fast, high-quality, balanced, backup)
- **Use Case Optimization**: Specialized routing for specific use cases (write, debug, research, etc.)
- **Intelligent Fallbacks**: Automatic fallback chains with local model support

### 🛡️ Robust Error Handling
- **Graceful Degradation**: Seamless fallback from cloud to local models
- **Docker Integration**: Automatic local model fallback via Docker containers
- **Comprehensive Logging**: Detailed attempt tracking and error reporting
- **Validation System**: Pre-flight checks for routing decisions

### 🧠 Memory Integration
- **Context Preservation**: Maintains conversation context across sessions
- **Project Scoping**: Memory compartmentalization by project/loadout
- **User Control**: Toggle memory on/off with manual override options

## Usage

### Basic Usage
```bash
# Simple task routing
node steward-enhanced.js "Help me debug this JavaScript error"

# With specific loadout
node steward-enhanced.js "Write a summary" --loadout sqa_mode

# Prefer specific model tier
node steward-enhanced.js "Research AI trends" --prefer-tier high-quality
```

### Advanced Options
```bash
# Use case override
node steward-enhanced.js "Fix this code" --use-case debug

# Memory control
node steward-enhanced.js "Continue our discussion" --memory on

# Dry run (show routing without execution)
node steward-enhanced.js "Test task" --dry-run --verbose

# Disable fallbacks
node steward-enhanced.js "Important task" --no-fallback

# MCP integration
node steward-enhanced.js "Process this" --mcp --send-mcp
```

### CLI Options Reference

| Option | Description | Values |
|--------|-------------|---------|
| `--loadout, -l` | Loadout configuration | creative, sqa_mode, frugal_mode, research_mode |
| `--prefer-tier` | Model tier preference | fast, high-quality, balanced, backup |
| `--use-case` | Use case optimization | write, debug, research, code, summarize, analyze |
| `--memory` | Memory override | on, off |
| `--dry-run` | Show routing without execution | boolean |
| `--verbose, -v` | Detailed output | boolean |
| `--no-fallback` | Disable model fallbacks | boolean |
| `--mcp` | Export to MCP JSON | boolean |
| `--send-mcp` | Send to MCP endpoint | boolean |

## Architecture

### Core Components

#### 1. Routing Engine (`src/core/routing-engine.js`)
- **Task Classification**: Multi-pattern keyword matching with confidence scoring
- **Model Selection**: Character sheet preferences with intelligent overrides
- **Fallback Generation**: Dynamic fallback chains based on model metadata

#### 2. CLI Handler (`src/core/cli-handler.js`)
- **Argument Parsing**: Comprehensive CLI option handling
- **Configuration Management**: Character sheet and loadout merging
- **Execution Pipeline**: Complete task execution with error handling

#### 3. Model Integration
- **Unified Interface**: Consistent API across all model types
- **Error Recovery**: Automatic fallback to alternative models
- **Performance Tracking**: Detailed logging of model calls and results

### Task Classification

The system uses a sophisticated classification system that:

1. **Tokenizes Input**: Breaks down user input into analyzable components
2. **Pattern Matching**: Uses weighted keyword patterns with confidence scores
3. **Multi-signal Analysis**: Considers context, keywords, and task structure
4. **Confidence Scoring**: Provides transparency into classification certainty

#### Classification Types
- `debug` - Code debugging and error fixing
- `write` - Content creation and composition
- `research` - Information gathering and investigation
- `summarize` - Content summarization and briefing
- `analyze` - Data analysis and evaluation
- `explain` - Explanations and descriptions
- `code` - Programming and implementation
- `sensitive` - Private or confidential tasks
- `route` - Meta-routing decisions
- `general` - General assistance

### Model Selection Logic

The routing engine follows this priority order:

1. **CLI Overrides**: `--prefer-tier` or `--use-case` flags
2. **Character Sheet Preferences**: Task-specific model preferences
3. **Use Case Matching**: Models optimized for the detected task type
4. **Fallback Chain**: Character sheet fallback → smollm3

### Error Handling & Fallbacks

The system implements a comprehensive fallback strategy:

1. **Primary Model**: Execute the selected model
2. **Fallback Chain**: Try each fallback model in priority order
3. **Docker Local**: Attempt Docker-based local models
4. **Final Fallback**: Use smollm3 as last resort

Each attempt is logged with detailed error information for debugging.

## Configuration

### Character Sheet Integration

The system loads configuration from:
1. **Base Character Sheet**: `character-sheet.yaml`
2. **Loadout Overrides**: `loadouts/{loadout-name}.yaml`
3. **Environment Variables**: `.env` file settings
4. **CLI Arguments**: Command-line overrides

### Loadout System

Loadouts provide contextual configuration profiles:

#### Creative Loadout
```yaml
tone: conversational
memory: off
model: gpt-4
verbosity: medium
```

#### SQA Mode
```yaml
memory: project-sqa
model: claude
verbosity: medium
focus: technical-accuracy
```

#### Frugal Mode
```yaml
model: smollm3
memory: off
tokens: low
prefer_local: true
```

#### Research Mode
```yaml
model: perplexity
tools: browsing
memory: project
verbosity: high
```

## Memory System

### Memory Integration
- **Automatic Context**: Loads relevant context based on project scope
- **Manual Override**: CLI flags can force memory on/off
- **Project Scoping**: Separate memory spaces for different projects
- **Privacy Control**: User has complete control over memory usage

### Memory Sources
- **MCP Integration**: Uses Model Context Protocol for persistence
- **Project Files**: Loads context from project-specific memory files
- **Session Context**: Maintains context within CLI sessions

## Logging & Feedback

### Comprehensive Logging
- **Routing Decisions**: Complete audit trail of routing logic
- **Model Attempts**: Detailed logs of all model call attempts
- **Error Tracking**: Full error context and recovery actions
- **Performance Metrics**: Response times and success rates

### User Feedback Loop
- **Interactive Feedback**: Prompts for user satisfaction
- **Feedback Storage**: Logs user ratings for routing improvement
- **Learning Integration**: Uses feedback for future routing optimization

## Testing

### Test Coverage
- **Unit Tests**: Core routing engine functionality
- **Integration Tests**: End-to-end CLI workflow testing
- **Mock Testing**: Isolated component testing with mocks

### Running Tests
```bash
# Run all tests
npm test

# Run routing engine tests specifically
npm run test:routing

# Run with coverage
npm test -- --coverage
```

## Development

### Development Mode
```bash
# Run with debugging
npm run dev

# Enhanced CLI with verbose output
npm run enhanced -- "test task" --verbose --dry-run
```

### Code Structure
```
src/
├── core/
│   ├── routing-engine.js    # Core routing logic
│   ├── cli-handler.js       # CLI interface
│   └── __tests__/          # Test files
├── utils/
│   └── routing.js          # Docker fallback utilities
models/                     # Model handlers and configuration
loadouts/                   # Loadout configuration files
logs/                       # System logs and audit trails
```

## Integration Points

### MCP (Model Context Protocol)
- **Memory Persistence**: Long-term context storage
- **Automation Bridge**: Integration with workflow systems
- **Data Export**: Structured output for external systems

### Docker Integration
- **Local Models**: Containerized local model hosting
- **Fallback System**: Automatic local model failover
- **Resource Management**: Efficient container lifecycle management

### Future Integrations
- **GUI Interface**: Web-based configuration and monitoring
- **API Endpoints**: REST API for external integration
- **Workflow Automation**: n8n and other automation platforms

## Troubleshooting

### Common Issues

#### Model Not Found
```
⚠️ Model gpt-4 not found in metadata
```
**Solution**: Check `models/models.yaml` for model configuration

#### Memory Loading Failed
```
⚠️ Memory loading failed: [error details]
```
**Solution**: Check memory system configuration and MCP integration

#### All Models Failed
```
❌ All models failed to provide a response
```
**Solution**: Check API keys, network connectivity, and Docker model status

### Debug Mode
Use `--verbose` flag for detailed routing information and error diagnostics.

### Log Analysis
Check `logs/routing_log.jsonl` for detailed routing decisions and patterns.

## Performance Optimization

### Caching Strategy
- **Model Metadata**: Cached model configuration for fast lookups
- **Routing Decisions**: Cached for similar task patterns
- **Memory Context**: Efficient context loading and storage

### Resource Management
- **Lazy Loading**: Models loaded only when needed
- **Connection Pooling**: Efficient API connection management
- **Memory Limits**: Configurable memory usage limits

## Security Considerations

### Privacy Protection
- **Local-First**: Sensitive tasks routed to local models by default
- **Memory Control**: User controls what information is remembered
- **API Key Security**: Secure storage and transmission of API credentials

### Data Handling
- **No Logging**: Sensitive content excluded from logs
- **Encryption**: Memory storage with optional encryption
- **Audit Trail**: Complete audit trail without sensitive content exposure

---

**Version**: 2.0  
**Last Updated**: July 29, 2025  
**Status**: Active Development
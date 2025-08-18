# Open WebUI Integration with The Steward

## Overview

The Steward now provides an **OpenAI-compatible API** that allows Open WebUI to connect directly to The Steward's intelligent routing system. This gives you the familiar Open WebUI interface while getting all the benefits of smart routing, ADHD accommodations, and cognitive-aware AI coordination.

## Quick Setup

### 1. Add The Steward as a Custom OpenAI API
In Open WebUI settings:

- **API Base URL**: `http://localhost:3002/v1`
- **API Key**: `sk-steward-local-api-key` (any value works for local)
- **Model Name**: Choose from available Steward models

### 2. Available "Models"

The Steward presents itself as multiple specialized models:

| Model Name | Purpose | Routing Behavior |
|------------|---------|------------------|
| `the-steward` | **Smart routing** | Full cognitive-aware routing based on task analysis |
| `the-steward-fast` | **Speed priority** | Prefers local models, optimized for quick responses |
| `the-steward-creative` | **Creative tasks** | Routes to models optimized for creative writing |
| `the-steward-analytical` | **Analysis tasks** | Routes to reasoning models for analytical work |

## Detailed Configuration

### Open WebUI Settings Path
1. Go to **Settings** → **Admin** → **Models**
2. Click **Add Model** or **Custom OpenAI API**
3. Enter The Steward connection details:

```
API Base URL: http://localhost:3002/v1
API Key: sk-steward-local-api-key
Organization: (leave blank)
```

### Alternative API Paths
The Steward provides multiple endpoint paths for compatibility:
- `http://localhost:3002/v1/*` (primary)
- `http://localhost:3002/openai/v1/*` (alternative)

## How It Works

### Smart Routing Behind the Scenes
When you send a prompt through Open WebUI:

1. **Open WebUI** sends your message to The Steward's OpenAI-compatible endpoint
2. **The Steward** analyzes your prompt using its smart routing engine
3. **Task Classification** determines the type of task (creative, analytical, debug, etc.)
4. **Model Selection** chooses the optimal model based on your character sheet preferences
5. **ADHD Accommodations** are applied automatically (context switching, cognitive load management)
6. **Response** is formatted in OpenAI-compatible format and returned to Open WebUI

### Model Selection Logic

#### `the-steward` (Default Smart Routing)
- Analyzes prompt for task type
- Considers your character sheet preferences
- Applies ADHD accommodations
- Routes to optimal model (local or cloud)
- Full cognitive-aware processing

#### `the-steward-fast`
- Prioritizes speed over sophistication
- Prefers local models when possible
- Good for quick questions and simple tasks
- Ideal for low cognitive energy periods

#### `the-steward-creative`  
- Routes to models optimized for creative writing
- Higher temperature settings for more creativity
- Best for fiction, brainstorming, ideation
- Enhanced with creative writing optimizations

#### `the-steward-analytical`
- Routes to reasoning-capable models
- Optimized for analysis, debugging, research
- Lower temperature for more focused responses
- Prefers models with strong analytical capabilities

## Benefits of Using Open WebUI + The Steward

### 🎯 **Familiar Interface with Smart Backend**
- Keep using Open WebUI's interface you already know
- Get The Steward's intelligent routing automatically
- No need to learn new interfaces or change workflows

### 🧠 **Cognitive-Aware Processing**
- ADHD accommodations applied automatically
- Task-appropriate model selection
- Context switching management
- Cognitive load optimization

### 📊 **Analytics & Learning**
- All interactions tracked by The Steward's analytics system
- Performance optimization over time
- Character sheet preferences automatically applied
- Usage patterns analyzed for improvement

### 🔄 **Seamless Model Management**
- No need to manually choose between models
- The Steward handles all model management
- Automatic fallbacks and error recovery
- Consistent experience across all model types

## Testing the Integration

### 1. Test Model Discovery
```bash
curl http://localhost:3002/v1/models
```

Should return the 4 Steward "models".

### 2. Test Chat Completion
```bash
curl -X POST http://localhost:3002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "the-steward",
    "messages": [{"role": "user", "content": "Hello, can you help me debug this code?"}],
    "temperature": 0.7
  }'
```

### 3. Open WebUI Connection Test
1. Add The Steward as a custom API in Open WebUI
2. Select "the-steward" as your model
3. Send a test message
4. Check The Steward logs: `tail -f logs/steward.log`

## Advanced Configuration

### Character Sheet Integration
Your character sheet preferences are automatically applied:
- Task type preferences (`creative`, `analytical`, `debug`, etc.)
- Model preferences (local vs cloud)
- ADHD accommodations
- Response style preferences

### Session Persistence
Each Open WebUI conversation gets a unique session ID for:
- Consistent routing decisions within a conversation
- Analytics tracking and learning
- Context preservation across messages

### Performance Monitoring
Monitor The Steward's routing decisions:
```bash
# View recent routing decisions
tail -f logs/steward.log | grep "routing"

# Check health status
npm run health

# View analytics
curl http://localhost:3002/api/analytics/performance
```

## Troubleshooting

### Open WebUI Can't Connect
1. Verify The Steward is running: `./service-manager.sh status`
2. Test API directly: `curl http://localhost:3002/v1/models`
3. Check firewall settings (port 3002)
4. Verify API base URL in Open WebUI settings

### Model Not Showing Up
1. Refresh Open WebUI models list
2. Clear Open WebUI cache
3. Try alternative API path: `http://localhost:3002/openai/v1`
4. Check The Steward logs for API errors

### Responses Seem Wrong
1. Check which actual model was selected in logs
2. Verify character sheet preferences
3. Try different Steward "model" (fast/creative/analytical)
4. Check The Steward health status

### Performance Issues
1. Monitor response times in analytics
2. Check if using appropriate Steward model for task
3. Verify local models are available and working
4. Consider adjusting character sheet preferences

## Example Workflows

### Code Debugging
1. Select `the-steward-analytical` in Open WebUI
2. Paste your problematic code
3. The Steward automatically routes to debugging-optimized models
4. Get analytical, step-by-step debugging assistance

### Creative Writing
1. Select `the-steward-creative` in Open WebUI
2. Start your story or creative prompt
3. The Steward routes to creative writing models
4. Get enhanced creative output with higher variety

### Quick Questions
1. Select `the-steward-fast` in Open WebUI
2. Ask simple questions or requests
3. Get rapid responses from local models
4. Ideal for low cognitive energy periods

### General Smart Routing
1. Select `the-steward` (default) in Open WebUI
2. Send any type of prompt
3. The Steward analyzes and routes appropriately
4. Get the best model for each specific task

## API Compatibility

### Supported OpenAI Endpoints
- ✅ `GET /v1/models` - List available models
- ✅ `POST /v1/chat/completions` - Chat completions (primary)
- ✅ `POST /v1/completions` - Legacy completions
- 🔄 `POST /v1/chat/completions` (streaming) - Basic streaming support

### Supported Parameters
- ✅ `messages` - Chat messages array
- ✅ `model` - Steward model selection
- ✅ `temperature` - Response creativity (0.0-2.0)
- ✅ `max_tokens` - Maximum response length
- ✅ `top_p` - Nucleus sampling
- 🔄 `stream` - Streaming responses (basic support)

### Response Format
Standard OpenAI format with additional Steward metadata:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "model": "the-steward",
  "choices": [...],
  "usage": {...},
  "steward_metadata": {
    "routing_decision": {...},
    "selected_model": "ai/smollm3:latest",
    "task_classification": "debug",
    "confidence": 0.85
  }
}
```

This integration gives you the best of both worlds: Open WebUI's polished interface with The Steward's intelligent, cognitive-aware routing system.

# The Steward Web Interface

A responsive React web application that provides a user-friendly interface for The Steward's smart AI routing engine.

## Features

### 🎯 Core Functionality
- **Smart Prompt Interface**: Intuitive chat-like interface for AI interactions
- **Routing Visualization**: Real-time display of smart routing decisions
- **Cross-Device Compatibility**: Responsive design for laptop/tablet/mobile
- **Progressive Web App**: Install and use offline on mobile devices

### 🧠 Smart Routing Features
- **Time-Aware Routing**: Adapts to your energy levels throughout the day
- **Task Classification**: Automatically categorizes prompts (debug, write, research, etc.)
- **Cognitive Profile Integration**: ADHD-aware routing with capacity alignment
- **Local-First Privacy**: Automatic local processing for sensitive content
- **Performance Learning**: Learns from usage patterns to improve routing

### 📊 Management Interfaces
- **Performance Dashboard**: Monitor routing decisions and model performance
- **Character Sheet Manager**: Configure preferences and cognitive profile
- **Model Management**: View available models and their status
- **Real-time Updates**: WebSocket integration for live routing insights

## Architecture

```
web-interface/
├── backend/           # Node.js Express API server
│   ├── src/
│   │   └── server.js  # Main API server wrapping smart routing engine
│   └── package.json   # Backend dependencies
├── frontend/          # React web application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API and WebSocket services
│   │   ├── theme.js       # Material-UI theme
│   │   └── App.js         # Main application
│   ├── public/            # Static assets and PWA manifest
│   └── package.json       # Frontend dependencies
└── shared/            # Shared utilities and types
```

## Getting Started

### Prerequisites
- Node.js 16+ installed
- The Steward CLI and smart routing engine set up
- API keys configured (if using cloud models)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd web-interface/backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the API server:
```bash
npm run dev  # Development mode with hot reload
# or
npm start    # Production mode
```

The API server will start on port 3002 and provide endpoints for:
- `POST /api/prompt` - Process prompts with smart routing
- `GET /api/models` - Get available models
- `GET /api/character-sheet` - Get character sheet preferences
- `GET /api/performance` - Get performance metrics
- WebSocket connection for real-time updates

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd web-interface/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The web interface will open at http://localhost:3001

### Production Build

To create a production build:
```bash
cd web-interface/frontend
npm run build
```

The built files will be in the `build/` directory and can be served by any static web server.

## Usage

### Basic Prompt Interface
1. Enter your prompt in the text field at the bottom
2. Press Enter or click Send to process
3. View the AI response and smart routing decision
4. Expand routing details to see cognitive analysis and performance insights

### Smart Routing Visualization
- **Task Classification**: Shows detected task type and confidence
- **Model Selection**: Displays chosen model and reasoning  
- **Cognitive Context**: Time awareness and ADHD accommodations
- **Privacy Analysis**: Local vs cloud routing decisions
- **Performance Insights**: Historical performance and recommendations

### Character Sheet Management
- Configure task type preferences
- Set cognitive patterns and energy profiles  
- Manage fallback behavior and model preferences
- Adjust neurotype-specific settings

### Performance Dashboard
- Monitor routing decision accuracy
- Track model performance over time
- View usage patterns and insights
- Analyze cognitive state correlations

## PWA Features

The web interface is a Progressive Web App that supports:

- **Installation**: Add to home screen on mobile devices
- **Offline Mode**: Basic functionality when internet is unavailable
- **Push Notifications**: Real-time updates (coming soon)
- **Native Feel**: App-like experience on mobile

To install:
1. Open the web interface in a supported browser
2. Look for the "Install" prompt or "Add to Home Screen" option
3. Follow the installation prompts

## API Integration

The frontend communicates with The Steward backend through:

### HTTP API
- RESTful endpoints for model management and preferences
- JSON request/response format
- Error handling and validation
- CORS enabled for cross-origin requests

### WebSocket Connection  
- Real-time routing decision updates
- Performance monitoring events
- Connection status indicators
- Automatic reconnection handling

## Customization

### Theming
The Material-UI theme can be customized in `frontend/src/theme.js`:
- Color palette for different model types
- Typography for technical vs creative tasks
- Component styling for responsive design

### Routing Visualization
Extend `RoutingVisualization.js` to show additional smart routing insights:
- Custom cognitive state indicators
- Performance trend visualization  
- Character sheet preference mapping

### API Extensions
Add new endpoints in `backend/src/server.js` for additional features:
- Conversation history management
- Advanced performance analytics
- Character sheet synchronization

## Browser Support

- **Desktop**: Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+, Samsung Internet 15+
- **PWA Features**: Chrome/Edge (full support), Safari (partial), Firefox (basic)

## Troubleshooting

### Connection Issues
- Check that backend API is running on port 3002
- Verify CORS configuration for your domain
- Ensure WebSocket connection is not blocked by firewall
- Note: Open WebUI uses port 3000, Steward Web Interface uses ports 3001/3002

### Model Availability  
- Verify model configurations in The Steward CLI
- Check API keys for cloud models
- Test model connections through the CLI first

### Performance Issues
- Check browser dev tools for network requests
- Monitor WebSocket connection stability
- Clear browser cache and service worker cache

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with responsive design in mind
4. Test across different screen sizes
5. Submit a pull request

## License

This project is licensed under the MIT License - see the main project LICENSE file for details.
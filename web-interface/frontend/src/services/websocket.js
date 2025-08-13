// WebSocket Service for real-time communication with The Steward backend
// Handles real-time updates for routing decisions and performance monitoring

class WebSocketManager {
  constructor() {
    this.ws = null;
    this.url = process.env.REACT_APP_WS_URL || 'ws://localhost:3002';
    this.reconnectInterval = 5000;
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.messageHandlers = new Map();
    this.subscriptions = new Set();
    
    // Event handlers
    this.onConnectHandlers = [];
    this.onDisconnectHandlers = [];
    this.onErrorHandlers = [];
    this.onMessageHandlers = [];
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    console.log(`Connecting to WebSocket: ${this.url}`);
    
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      console.log('Disconnecting WebSocket');
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = (event) => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Subscribe to channels if any
      if (this.subscriptions.size > 0) {
        this.send({
          type: 'subscribe',
          channels: Array.from(this.subscriptions)
        });
      }

      // Notify connection handlers
      this.onConnectHandlers.forEach(handler => handler(event));
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnected = false;

      // Notify disconnect handlers
      this.onDisconnectHandlers.forEach(handler => handler(event));

      // Attempt to reconnect if not a manual disconnect
      if (event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      
      // Notify error handlers
      this.onErrorHandlers.forEach(handler => handler(error));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error, event.data);
      }
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(message) {
    console.log('WebSocket message received:', message);

    // Handle specific message types
    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed:', message.message);
        break;
      
      case 'pong':
        console.log('WebSocket ping response received');
        break;
      
      case 'prompt_processed':
        console.log('Prompt processing completed:', message.data);
        break;
      
      default:
        // Handle custom message types
        if (this.messageHandlers.has(message.type)) {
          this.messageHandlers.get(message.type)(message);
        }
    }

    // Notify all message handlers
    this.onMessageHandlers.forEach(handler => handler(message));
  }

  /**
   * Send message to WebSocket server
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message:', message);
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
      return false;
    }
  }

  /**
   * Handle reconnection logic
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting WebSocket (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Subscribe to specific channels for updates
   */
  subscribe(channels) {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    channels.forEach(channel => this.subscriptions.add(channel));

    if (this.isConnected) {
      this.send({
        type: 'subscribe',
        channels: Array.from(this.subscriptions)
      });
    }
  }

  /**
   * Unsubscribe from channels
   */
  unsubscribe(channels) {
    if (!Array.isArray(channels)) {
      channels = [channels];
    }

    channels.forEach(channel => this.subscriptions.delete(channel));

    if (this.isConnected) {
      this.send({
        type: 'unsubscribe',
        channels: channels
      });
    }
  }

  /**
   * Send ping to server
   */
  ping() {
    this.send({ type: 'ping', timestamp: Date.now() });
  }

  /**
   * Register event handlers
   */
  onConnect(handler) {
    this.onConnectHandlers.push(handler);
  }

  onDisconnect(handler) {
    this.onDisconnectHandlers.push(handler);
  }

  onError(handler) {
    this.onErrorHandlers.push(handler);
  }

  onMessage(handler) {
    this.onMessageHandlers.push(handler);
  }

  /**
   * Register handler for specific message type
   */
  onMessageType(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      readyState: this.ws?.readyState,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: Array.from(this.subscriptions)
    };
  }
}

// Create singleton instance
const WebSocketService = new WebSocketManager();

// Auto-connect when service is imported
if (typeof window !== 'undefined') {
  // Only connect in browser environment
  window.addEventListener('beforeunload', () => {
    WebSocketService.disconnect();
  });
}

export { WebSocketService };
export default WebSocketService;
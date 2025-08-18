#!/bin/bash

# The Steward Service Manager
# Provides auto-restart, health monitoring, and service management for The Steward

STEWARD_DIR="/Users/chip/-WORKROOM-/- Projects/The Steward/The-Steward"
LOG_DIR="$STEWARD_DIR/logs"
PID_FILE="$LOG_DIR/steward.pid"
HEALTH_LOG="$LOG_DIR/health.log"
SERVICE_LOG="$LOG_DIR/service.log"
MAX_RESTART_ATTEMPTS=5
RESTART_DELAY=10
HEALTH_CHECK_INTERVAL=30

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$SERVICE_LOG"
}

# Check if The Steward is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Health check function
health_check() {
    if ! is_running; then
        return 1
    fi
    
    # Check if backend is responding (if using web interface)
    if curl -s -f "http://localhost:3002/health" > /dev/null 2>&1; then
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Health check: HEALTHY" >> "$HEALTH_LOG"
        return 0
    else
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Health check: UNHEALTHY" >> "$HEALTH_LOG"
        return 1
    fi
}

# Start The Steward
start_steward() {
    if is_running; then
        log "The Steward is already running"
        return 0
    fi
    
    log "Starting The Steward..."
    cd "$STEWARD_DIR"
    
    # Start with process management
    nohup npm run start-all > "$LOG_DIR/steward.log" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    # Wait a moment and verify it started
    sleep 5
    if is_running; then
        log "The Steward started successfully (PID: $pid)"
        return 0
    else
        log "Failed to start The Steward"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Stop The Steward
stop_steward() {
    if ! is_running; then
        log "The Steward is not running"
        return 0
    fi
    
    local pid=$(cat "$PID_FILE")
    log "Stopping The Steward (PID: $pid)..."
    
    # Try graceful shutdown first
    kill "$pid" 2>/dev/null
    sleep 5
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        log "Force killing The Steward..."
        kill -9 "$pid" 2>/dev/null
    fi
    
    # Clean up any remaining processes
    pkill -f 'steward.*node' 2>/dev/null || true
    pkill -f 'npm.*start-all' 2>/dev/null || true
    
    rm -f "$PID_FILE"
    log "The Steward stopped"
}

# Restart The Steward
restart_steward() {
    log "Restarting The Steward..."
    stop_steward
    sleep 2
    start_steward
}

# Service monitoring loop
monitor_service() {
    local restart_count=0
    local last_restart_time=0
    
    log "Starting service monitor..."
    
    while true; do
        if ! health_check; then
            local current_time=$(date +%s)
            
            # Reset restart count if it's been more than 1 hour since last restart
            if [ $((current_time - last_restart_time)) -gt 3600 ]; then
                restart_count=0
            fi
            
            if [ $restart_count -lt $MAX_RESTART_ATTEMPTS ]; then
                restart_count=$((restart_count + 1))
                last_restart_time=$current_time
                
                log "Service unhealthy, attempting restart ($restart_count/$MAX_RESTART_ATTEMPTS)"
                restart_steward
                
                if [ $restart_count -eq $MAX_RESTART_ATTEMPTS ]; then
                    log "Maximum restart attempts reached. Manual intervention required."
                    log "Check logs and system status before restarting service."
                fi
            else
                log "Service monitor sleeping due to max restart attempts reached"
            fi
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
    done
}

# Install as launchd service (macOS auto-start)
install_service() {
    local plist_file="$HOME/Library/LaunchAgents/com.chiptalbert.steward.plist"
    
    log "Installing The Steward as system service..."
    
    cat > "$plist_file" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.chiptalbert.steward</string>
    <key>ProgramArguments</key>
    <array>
        <string>$STEWARD_DIR/service-manager.sh</string>
        <string>monitor</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/service.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/service.log</string>
    <key>WorkingDirectory</key>
    <string>$STEWARD_DIR</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
    </dict>
</dict>
</plist>
EOF

    launchctl load "$plist_file"
    log "Service installed and loaded. The Steward will start automatically on boot."
}

# Uninstall service
uninstall_service() {
    local plist_file="$HOME/Library/LaunchAgents/com.chiptalbert.steward.plist"
    
    log "Uninstalling The Steward service..."
    launchctl unload "$plist_file" 2>/dev/null || true
    rm -f "$plist_file"
    log "Service uninstalled"
}

# Status check
status() {
    echo "=== The Steward Service Status ==="
    echo "Working Directory: $STEWARD_DIR"
    echo "PID File: $PID_FILE"
    echo ""
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        echo "Status: RUNNING (PID: $pid)"
        
        # Show recent health status
        if [ -f "$HEALTH_LOG" ]; then
            echo "Recent Health Checks:"
            tail -5 "$HEALTH_LOG" | sed 's/^/  /'
        fi
    else
        echo "Status: STOPPED"
    fi
    
    echo ""
    echo "Recent Service Log:"
    if [ -f "$SERVICE_LOG" ]; then
        tail -10 "$SERVICE_LOG" | sed 's/^/  /'
    else
        echo "  No service log available"
    fi
}

# Main command handler
case "$1" in
    start)
        start_steward
        ;;
    stop)
        stop_steward
        ;;
    restart)
        restart_steward
        ;;
    status)
        status
        ;;
    monitor)
        monitor_service
        ;;
    install)
        install_service
        ;;
    uninstall)
        uninstall_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|monitor|install|uninstall}"
        echo ""
        echo "Commands:"
        echo "  start      - Start The Steward service"
        echo "  stop       - Stop The Steward service"
        echo "  restart    - Restart The Steward service"
        echo "  status     - Show service status and recent logs"
        echo "  monitor    - Run continuous health monitoring with auto-restart"
        echo "  install    - Install as system service (auto-start on boot)"
        echo "  uninstall  - Remove system service"
        exit 1
        ;;
esac

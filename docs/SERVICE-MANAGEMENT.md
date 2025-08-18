# The Steward Service Management & Auto-Recovery System

## Overview

The Steward now includes a comprehensive service management system with automatic restart capabilities, health monitoring, and boot-time startup. This ensures The Steward remains online 24/7 with minimal manual intervention.

## Features

### 🔄 Auto-Restart & Recovery
- **Automatic failure detection** with health checks every 30 seconds
- **Smart restart logic** with exponential backoff (max 5 attempts per hour)
- **Self-healing capabilities** that fix common issues automatically
- **Graceful degradation** when maximum restart attempts are reached

### 🚀 Boot-Time Startup
- **macOS LaunchAgent integration** for automatic startup on boot
- **Proper environment handling** with PATH and NODE_ENV setup
- **Service persistence** that survives user logouts and system reboots

### 📊 Health Monitoring
- **Comprehensive health checks** covering all system components
- **Real-time monitoring** with detailed logging and reporting
- **Performance tracking** with historical health data
- **Issue categorization** (Pass/Warn/Fail) with actionable feedback

### 🔧 Auto-Recovery
- **Intelligent issue detection** and automatic fixing
- **Common failure patterns** handled automatically (stale PIDs, missing dependencies, permission issues)
- **Progressive recovery** that attempts fixes in order of severity
- **Fallback mechanisms** when automatic recovery fails

## Quick Start Commands

### Basic Service Management
```bash
# Start The Steward
npm run service:start

# Stop The Steward  
npm run service:stop

# Restart The Steward
npm run service:restart

# Check service status
npm run service:status
```

### Health & Recovery
```bash
# Run health check
npm run health

# Auto-recover from issues
npm run recover

# Continuous health monitoring
npm run health:watch
```

### Advanced Service Operations
```bash
# Start monitoring daemon (auto-restart enabled)
npm run service:monitor

# Install as system service (auto-start on boot)
npm run service:install

# Remove system service
npm run service:uninstall
```

## Installation for 24/7 Operation

### Step 1: Install as System Service
```bash
cd /Users/chip/-WORKROOM-/- Projects/The\ Steward/The-Steward
npm run service:install
```

This will:
- Create a macOS LaunchAgent configuration
- Enable automatic startup on boot
- Set up proper environment variables
- Configure logging and error handling

### Step 2: Verify Installation
```bash
npm run service:status
```

Should show "Status: RUNNING" with recent health checks.

### Step 3: Test Auto-Recovery
```bash
# Simulate a failure
pkill -f steward

# Wait 30 seconds, then check status
npm run service:status
```

The service should automatically restart within 30 seconds.

## Service Architecture

### Components

1. **service-manager.sh** - Main service controller
   - Process management and PID tracking
   - Health checks and auto-restart logic
   - System service integration
   - Logging and monitoring

2. **health-check.js** - Comprehensive health monitoring
   - Process status verification
   - Memory module validation  
   - Backend API connectivity
   - Database and dependency checks
   - File permission validation

3. **auto-recovery.js** - Intelligent self-healing
   - Issue detection and categorization
   - Automatic fixes for common problems
   - Dependency installation and updates
   - Service restart coordination

### File Structure
```
The-Steward/
├── service-manager.sh      # Service controller
├── health-check.js         # Health monitoring
├── auto-recovery.js        # Auto-recovery system
├── logs/
│   ├── steward.log        # Main application log
│   ├── service.log        # Service management log
│   ├── health.log         # Health check history
│   └── health-report.json # Detailed health reports
└── package.json           # Enhanced with service commands
```

## Configuration

### Environment Variables
The service respects standard environment variables:
- `NODE_ENV=production` (set automatically for service mode)
- `PORT` - Backend API port (default: 3002)
- `FRONTEND_URL` - Frontend URL for CORS

### LaunchAgent Configuration
Service configuration is stored in:
`~/Library/LaunchAgents/com.chiptalbert.steward.plist`

### Logging Configuration
- **Main Log**: `logs/steward.log` - Application output
- **Service Log**: `logs/service.log` - Service management events
- **Health Log**: `logs/health.log` - Health check results
- **Error Handling**: Automatic log rotation and cleanup

## Monitoring & Troubleshooting

### Health Check Categories

1. **Process Check** - Verifies service is running
2. **Memory Module** - Validates memory.js exports
3. **Backend API** - Tests API responsiveness
4. **Frontend Build** - Checks build files
5. **Database Access** - Validates database files
6. **File Permissions** - Ensures proper access
7. **Dependencies** - Verifies npm packages
8. **Environment** - Checks Node.js version and .env

### Common Issues & Auto-Fixes

| Issue | Auto-Fix |
|-------|----------|
| Stale PID files | Automatic cleanup |
| Missing dependencies | `npm install` |
| Permission errors | `chmod` correction |
| Hanging processes | Process cleanup |
| Missing directories | Directory creation |
| Database issues | Migration execution |

### Manual Troubleshooting

If auto-recovery fails:

1. **Check logs**:
   ```bash
   tail -f logs/service.log
   tail -f logs/steward.log
   ```

2. **Run full health check**:
   ```bash
   npm run health
   ```

3. **Attempt manual recovery**:
   ```bash
   npm run recover
   ```

4. **Reset service completely**:
   ```bash
   npm run service:uninstall
   npm run service:install
   ```

## Performance Impact

### Resource Usage
- **Memory**: ~50MB additional for monitoring
- **CPU**: <1% during normal operation
- **Disk**: Minimal (log rotation prevents bloat)

### Monitoring Frequency
- **Health checks**: Every 30 seconds
- **Process verification**: Every check
- **API testing**: Every check (5-second timeout)
- **Log cleanup**: Daily automatic rotation

## Security Considerations

### Process Security
- Service runs under user account (not root)
- Proper file permissions (644 for files, 755 for executables)
- No elevated privileges required

### Network Security
- Health checks use localhost only
- API endpoints protected by CORS
- No external network dependencies for monitoring

### Data Protection
- Logs contain no sensitive information
- PID files and status in protected directories
- Service configuration in user LaunchAgents only

## Advanced Configuration

### Custom Health Checks
Extend `health-check.js` to add application-specific checks:

```javascript
async checkCustomFeature() {
  // Your custom health check logic
  return { status: 'pass', message: 'Custom feature OK' };
}
```

### Custom Recovery Actions
Extend `auto-recovery.js` for application-specific fixes:

```javascript
async fixCustomIssue(issue) {
  // Your custom recovery logic
  return true; // or false if fix failed
}
```

### Monitoring Integration
The health check system can integrate with external monitoring:

```bash
# Export health data for external systems
npm run health | jq '.overallHealth'
```

## Migration from Manual Operation

If you were previously running The Steward manually:

1. **Stop manual processes**:
   ```bash
   npm run stop-all
   ```

2. **Install service**:
   ```bash
   npm run service:install
   ```

3. **Verify operation**:
   ```bash
   npm run service:status
   npm run health
   ```

Your existing configuration, logs, and data will be preserved.

## Uninstalling Service Management

To return to manual operation:

```bash
# Remove system service
npm run service:uninstall

# Stop any running processes
npm run service:stop

# Use manual commands
npm run start-daemon  # or npm start
```

The monitoring and recovery scripts remain available even without the system service.

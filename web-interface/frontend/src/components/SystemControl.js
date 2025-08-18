import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Button,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Refresh as RestartIcon,
  Settings as SettingsIcon,
  Storage as DatabaseIcon,
  Wifi as ApiIcon,
  Speed as PerformanceIcon,
  Security as SecurityIcon,
  BackupTable as BackupIcon,
  GetApp as ExportIcon,
  Publish as ImportIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as HealthyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';

function SystemControl() {
  const [loading, setLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    stewardService: 'running',
    apiService: 'running',
    webSocket: 'connected',
    database: 'healthy',
    models: { local: 3, cloud: 2, total: 5 },
    uptime: '2h 15m',
    memoryUsage: 65,
    lastHealthCheck: new Date().toISOString()
  });
  const [backupDialog, setBackupDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const [notification, setNotification] = useState(null);
  const [autoStart, setAutoStart] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  
  useEffect(() => {
    loadSystemStatus();
    // Set up periodic health checks
    const interval = setInterval(loadSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      // In real implementation, this would call the health endpoint
      // For now, simulate periodic updates
      setSystemStatus(prev => ({
        ...prev,
        uptime: calculateUptime(),
        memoryUsage: Math.max(40, Math.min(80, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        lastHealthCheck: new Date().toISOString()
      }));
      setLoading(false);
    } catch (error) {
      console.error('Failed to load system status:', error);
      setLoading(false);
    }
  };

  const calculateUptime = () => {
    // Simulate uptime calculation
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.floor(Math.random() * 60);
    return `${hours}h ${minutes}m`;
  };

  const handleServiceAction = async (service, action) => {
    try {
      setNotification({ message: `${action}ing ${service}...`, severity: 'info' });
      
      // Simulate service action
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSystemStatus(prev => ({
        ...prev,
        [service]: action === 'start' ? 'running' : action === 'stop' ? 'stopped' : 'running'
      }));
      
      setNotification({ 
        message: `${service} ${action}${action.endsWith('p') ? 'ped' : 'ed'} successfully`, 
        severity: 'success' 
      });
    } catch (error) {
      setNotification({ 
        message: `Failed to ${action} ${service}: ${error.message}`, 
        severity: 'error' 
      });
    }
  };

  const handleBackupExport = async () => {
    try {
      setNotification({ message: 'Creating configuration backup...', severity: 'info' });
      
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real implementation, this would trigger a download
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        characterSheet: {},
        modelConfigurations: {},
        systemSettings: {}
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `steward-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setNotification({ message: 'Configuration backup created successfully', severity: 'success' });
      setBackupDialog(false);
    } catch (error) {
      setNotification({ message: 'Backup failed: ' + error.message, severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return 'success';
      case 'stopped':
      case 'disconnected':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
      case 'connected':
      case 'healthy':
        return <HealthyIcon color="success" />;
      case 'stopped':
      case 'disconnected':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
            System Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor services, manage system settings, and handle backups
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<BackupIcon />}
            onClick={() => setBackupDialog(true)}
          >
            Backup
          </Button>
          <Button
            variant="outlined"
            startIcon={<ImportIcon />}
            onClick={() => setImportDialog(true)}
          >
            Import
          </Button>
        </Box>
      </Box>

      {/* System Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <PerformanceIcon sx={{ mr: 1 }} />
            System Status Overview
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Uptime
                </Typography>
                <Typography variant="h6">
                  {systemStatus.uptime}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Memory Usage
                </Typography>
                <Typography variant="h6">
                  {systemStatus.memoryUsage}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={systemStatus.memoryUsage} 
                  sx={{ mt: 1 }}
                />
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Active Models
                </Typography>
                <Typography variant="h6">
                  {systemStatus.models.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({systemStatus.models.local} local, {systemStatus.models.cloud} cloud)
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Last Health Check
                </Typography>
                <Typography variant="body2">
                  {new Date(systemStatus.lastHealthCheck).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Service Management */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Service Management</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List>
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(systemStatus.stewardService)}
              </ListItemIcon>
              <ListItemText
                primary="The Steward Service"
                secondary="Core routing and intelligence engine"
              />
              <Chip
                size="small"
                label={systemStatus.stewardService}
                color={getStatusColor(systemStatus.stewardService)}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Button
                size="small"
                startIcon={systemStatus.stewardService === 'running' ? <StopIcon /> : <StartIcon />}
                onClick={() => handleServiceAction('stewardService', 
                  systemStatus.stewardService === 'running' ? 'stop' : 'start')}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                {systemStatus.stewardService === 'running' ? 'Stop' : 'Start'}
              </Button>
              <Button
                size="small"
                startIcon={<RestartIcon />}
                onClick={() => handleServiceAction('stewardService', 'restart')}
                variant="outlined"
              >
                Restart
              </Button>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(systemStatus.apiService)}
              </ListItemIcon>
              <ListItemText
                primary="API Service"
                secondary="Web interface and external API endpoints"
              />
              <Chip
                size="small"
                label={systemStatus.apiService}
                color={getStatusColor(systemStatus.apiService)}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              <Button
                size="small"
                startIcon={systemStatus.apiService === 'running' ? <StopIcon /> : <StartIcon />}
                onClick={() => handleServiceAction('apiService', 
                  systemStatus.apiService === 'running' ? 'stop' : 'start')}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                {systemStatus.apiService === 'running' ? 'Stop' : 'Start'}
              </Button>
              <Button
                size="small"
                startIcon={<RestartIcon />}
                onClick={() => handleServiceAction('apiService', 'restart')}
                variant="outlined"
              >
                Restart
              </Button>
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(systemStatus.webSocket)}
              </ListItemIcon>
              <ListItemText
                primary="WebSocket Connection"
                secondary="Real-time communication for live updates"
              />
              <Chip
                size="small"
                label={systemStatus.webSocket}
                color={getStatusColor(systemStatus.webSocket)}
                variant="outlined"
              />
            </ListItem>
            
            <Divider />
            
            <ListItem>
              <ListItemIcon>
                {getStatusIcon(systemStatus.database)}
              </ListItemIcon>
              <ListItemText
                primary="Database"
                secondary="Performance logs and learning data"
              />
              <Chip
                size="small"
                label={systemStatus.database}
                color={getStatusColor(systemStatus.database)}
                variant="outlined"
              />
            </ListItem>
          </List>
        </AccordionDetails>
      </Accordion>

      {/* System Configuration */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6">System Configuration</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoStart}
                    onChange={(e) => setAutoStart(e.target.checked)}
                  />
                }
                label="Auto-start services on system boot"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={debugMode}
                    onChange={(e) => setDebugMode(e.target.checked)}
                  />
                }
                label="Enable debug mode"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Log Level</InputLabel>
                <Select
                  defaultValue="info"
                  label="Log Level"
                >
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Health Check Interval</InputLabel>
                <Select
                  defaultValue="5"
                  label="Health Check Interval"
                >
                  <MenuItem value="1">1 second</MenuItem>
                  <MenuItem value="5">5 seconds</MenuItem>
                  <MenuItem value="10">10 seconds</MenuItem>
                  <MenuItem value="30">30 seconds</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Backup & Restore */}
      <Dialog open={backupDialog} onClose={() => setBackupDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Configuration Backup</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This will export your current configuration including character sheet preferences, 
            model settings, and system configuration.
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText primary="Character sheet preferences" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText primary="Model configurations" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText primary="System settings" />
            </ListItem>
            <ListItem>
              <ListItemIcon><CheckCircle color="primary" /></ListItemIcon>
              <ListItemText primary="Performance metrics" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackupDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleBackupExport}
            variant="contained"
            startIcon={<ExportIcon />}
          >
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Configuration */}
      <Dialog open={importDialog} onClose={() => setImportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Import a previously exported configuration file to restore your settings.
          </Typography>
          
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="import-file-input"
            type="file"
            onChange={(e) => {
              // Handle file import
              console.log('File selected:', e.target.files[0]);
            }}
          />
          <label htmlFor="import-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<ImportIcon />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Choose Configuration File
            </Button>
          </label>
          
          <Alert severity="warning" sx={{ mt: 2 }}>
            <strong>Warning:</strong> Importing will overwrite your current configuration. 
            Consider creating a backup first.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialog(false)}>Cancel</Button>
          <Button variant="contained" disabled>
            Import Configuration
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SystemControl;
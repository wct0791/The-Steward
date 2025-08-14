// #region start: Cross-App Sync Status for Ambient Intelligence
// Displays real-time synchronization status across Notion, Things, and Apple Notes
// Shows sync health, conflicts, and provides manual sync controls

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  CloudSync as CloudSyncIcon,
  Storage as StorageIcon
} from '@mui/icons-material';

/**
 * CrossAppSyncStatus - Real-time sync status across productivity apps
 * 
 * Features:
 * - Display sync health for Notion, Things, and Apple Notes
 * - Show pending sync operations and conflicts
 * - Provide manual sync triggers and conflict resolution
 * - Monitor data consistency and sync performance
 * - Configure sync preferences and automation rules
 */
const CrossAppSyncStatus = ({
  syncStatus = {},
  conflictQueue = [],
  onManualSync = () => {},
  onResolveConflict = () => {},
  onUpdateSyncSettings = () => {},
  ambientOrchestrator = null
}) => {
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [conflictDialog, setConflictDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [syncSettings, setSyncSettings] = useState({
    auto_sync_enabled: true,
    sync_frequency: 'real_time',
    conflict_resolution: 'latest_wins',
    enable_notifications: true
  });

  // Mock sync status if not provided
  const defaultSyncStatus = {
    notion: {
      status: 'connected',
      last_sync: '2024-01-15T10:30:00Z',
      pending_operations: 2,
      sync_health: 0.95,
      context_detected: true,
      project_pages: 5
    },
    things: {
      status: 'syncing',
      last_sync: '2024-01-15T10:28:00Z',
      pending_operations: 0,
      sync_health: 0.88,
      tasks_created: 12,
      scheduled_tasks: 8
    },
    apple_notes: {
      status: 'connected',
      last_sync: '2024-01-15T10:32:00Z',
      pending_operations: 1,
      sync_health: 0.92,
      sessions_captured: 3,
      research_compilations: 1
    },
    overall_health: 0.92,
    active_workflows: 2,
    context_bridge_health: 0.89,
    last_coordination: '2024-01-15T10:31:00Z'
  };

  const currentSyncStatus = { ...defaultSyncStatus, ...syncStatus };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'syncing': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'disabled': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckIcon />;
      case 'syncing': return <SyncIcon className="rotating" />;
      case 'warning': return <WarningIcon />;
      case 'error': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const renderAppSyncCard = (appName, appData) => {
    const appNames = {
      notion: 'Notion',
      things: 'Things 3',
      apple_notes: 'Apple Notes'
    };

    const appIcons = {
      notion: '📋',
      things: '✅',
      apple_notes: '📝'
    };

    return (
      <Card key={appName} elevation={2} sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" sx={{ mr: 1 }}>
                {appIcons[appName]} {appNames[appName]}
              </Typography>
              <Chip
                icon={getStatusIcon(appData.status)}
                label={appData.status}
                color={getStatusColor(appData.status)}
                size="small"
              />
            </Box>
            <IconButton
              size="small"
              onClick={() => onManualSync(appName)}
              disabled={appData.status === 'syncing'}
            >
              <RefreshIcon />
            </IconButton>
          </Box>

          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" mb={1}>
              Sync Health
            </Typography>
            <LinearProgress
              variant="determinate"
              value={appData.sync_health * 100}
              color={appData.sync_health > 0.8 ? 'success' : 'warning'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="textSecondary">
              {Math.round(appData.sync_health * 100)}%
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Last Sync
              </Typography>
              <Typography variant="body2">
                {formatLastSync(appData.last_sync)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Pending
              </Typography>
              <Typography variant="body2">
                {appData.pending_operations} ops
              </Typography>
            </Grid>
          </Grid>

          {/* App-specific metrics */}
          {appName === 'notion' && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block">
                Project Pages: {appData.project_pages}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Context Detection: {appData.context_detected ? '✓' : '✗'}
              </Typography>
            </Box>
          )}

          {appName === 'things' && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block">
                Tasks Created: {appData.tasks_created}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Scheduled: {appData.scheduled_tasks}
              </Typography>
            </Box>
          )}

          {appName === 'apple_notes' && (
            <Box mt={2}>
              <Typography variant="caption" color="textSecondary" display="block">
                Sessions Captured: {appData.sessions_captured}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Compilations: {appData.research_compilations}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderOverallStatus = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <CloudSyncIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Cross-App Coordination</Typography>
          </Box>
          <Button
            startIcon={<SettingsIcon />}
            size="small"
            onClick={() => setSettingsDialog(true)}
          >
            Settings
          </Button>
        </Box>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={3}>
            <Box textAlign="center">
              <Typography variant="h3" color="primary">
                {Math.round(currentSyncStatus.overall_health * 100)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Overall Health
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box textAlign="center">
              <Typography variant="h3" color="secondary">
                {currentSyncStatus.active_workflows}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Workflows
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box textAlign="center">
              <Typography variant="h3" color="warning.main">
                {conflictQueue.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Conflicts
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box textAlign="center">
              <Typography variant="h3" color="success.main">
                {Math.round(currentSyncStatus.context_bridge_health * 100)}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Bridge Health
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box>
          <Typography variant="body2" color="textSecondary" mb={1}>
            Last Coordination: {formatLastSync(currentSyncStatus.last_coordination)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Sync Mode: {syncSettings.sync_frequency.replace('_', ' ').toUpperCase()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const renderConflictQueue = () => {
    if (conflictQueue.length === 0) {
      return (
        <Alert severity="success">
          <Typography variant="body2">
            No sync conflicts detected. All apps are in harmony.
          </Typography>
        </Alert>
      );
    }

    return (
      <Box>
        <Typography variant="h6" mb={2}>Sync Conflicts ({conflictQueue.length})</Typography>
        <List>
          {conflictQueue.slice(0, 5).map((conflict, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <Button
                  size="small"
                  onClick={() => {
                    setSelectedConflict(conflict);
                    setConflictDialog(true);
                  }}
                >
                  Resolve
                </Button>
              }
            >
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={conflict.type || 'Sync Conflict'}
                secondary={`${conflict.apps?.join(' ↔ ') || 'Multiple apps'} - ${conflict.severity || 'medium'} priority`}
              />
            </ListItem>
          ))}
          {conflictQueue.length > 5 && (
            <ListItem>
              <ListItemText
                primary={`${conflictQueue.length - 5} more conflicts...`}
                sx={{ fontStyle: 'italic', color: 'text.secondary' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
    );
  };

  const renderSettingsDialog = () => (
    <Dialog
      open={settingsDialog}
      onClose={() => setSettingsDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>Cross-App Sync Settings</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={syncSettings.auto_sync_enabled}
                onChange={(e) => setSyncSettings({
                  ...syncSettings,
                  auto_sync_enabled: e.target.checked
                })}
              />
            }
            label="Enable Automatic Synchronization"
          />
          
          <Typography variant="body2" color="textSecondary" mb={2}>
            When enabled, changes in one app automatically propagate to other connected apps.
          </Typography>

          {/* Additional sync settings would go here */}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            onUpdateSyncSettings(syncSettings);
            setSettingsDialog(false);
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderConflictDialog = () => (
    <Dialog
      open={conflictDialog}
      onClose={() => setConflictDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Resolve Sync Conflict</DialogTitle>
      <DialogContent>
        {selectedConflict && (
          <Box mt={2}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" mb={1}>
                {selectedConflict.type}
              </Typography>
              <Typography variant="body2">
                {selectedConflict.description || 'A sync conflict has been detected between your apps.'}
              </Typography>
            </Alert>

            <Typography variant="h6" mb={2}>Affected Apps</Typography>
            <Box display="flex" gap={1} mb={2}>
              {(selectedConflict.apps || []).map(app => (
                <Chip key={app} label={app} />
              ))}
            </Box>

            <Typography variant="h6" mb={2}>Resolution Options</Typography>
            {/* Conflict resolution options would be rendered here */}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setConflictDialog(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedConflict) {
              onResolveConflict(selectedConflict);
            }
            setConflictDialog(false);
            setSelectedConflict(null);
          }}
        >
          Resolve Conflict
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <TimelineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Cross-App Sync Status</Typography>
          <Tooltip title="Real-time synchronization status across your productivity apps">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={() => onManualSync('all')}
          disabled={Object.values(currentSyncStatus).some(app => 
            typeof app === 'object' && app.status === 'syncing'
          )}
        >
          Sync All
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Overall Status */}
        <Grid item xs={12}>
          {renderOverallStatus()}
        </Grid>

        {/* Individual App Status */}
        <Grid item xs={12} md={4}>
          {renderAppSyncCard('notion', currentSyncStatus.notion)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderAppSyncCard('things', currentSyncStatus.things)}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderAppSyncCard('apple_notes', currentSyncStatus.apple_notes)}
        </Grid>

        {/* Conflict Queue */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              {renderConflictQueue()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialogs */}
      {renderSettingsDialog()}
      {renderConflictDialog()}

      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .rotating {
          animation: rotate 2s linear infinite;
        }
      `}</style>
    </Box>
  );
};

export default CrossAppSyncStatus;

// #endregion end: Cross-App Sync Status
// #region start: Ambient Intelligence Panel for The Steward
// Main dashboard panel for ambient intelligence coordination across productivity apps
// Provides unified view of cross-app workflows, context awareness, and automation controls

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge
} from '@mui/material';
import {
  SmartToy as SmartToyIcon,
  Apps as AppsIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import CrossAppSyncStatus from './CrossAppSyncStatus';
import AmbientCoordinationAnalytics from './AmbientCoordinationAnalytics';

/**
 * AmbientIntelligencePanel - Master control panel for ambient intelligence
 * 
 * Features:
 * - Monitor and control ambient intelligence across all connected apps
 * - Display real-time context awareness and workflow coordination status
 * - Provide quick access to sync controls and conflict resolution
 * - Show ambient automation rules and their effectiveness
 * - Enable/disable ambient intelligence features with granular control
 * - Surface predictive insights and optimization recommendations
 */
const AmbientIntelligencePanel = ({
  ambientStatus = null,
  onToggleAmbientIntelligence = () => {},
  onUpdateAutomationRules = () => {},
  onTriggerWorkflowCoordination = () => {},
  currentProject = null,
  characterSheet = null
}) => {
  const [ambientEnabled, setAmbientEnabled] = useState(true);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, sync, analytics
  const [automationRules, setAutomationRules] = useState({
    session_start: true,
    workflow_creation: true,
    context_change: true,
    session_completion: true
  });

  // Mock ambient status if not provided
  const mockAmbientStatus = {
    enabled: ambientEnabled,
    apps_connected: {
      notion: { status: 'connected', context_detected: true },
      things: { status: 'connected', tasks_synced: 12 },
      apple_notes: { status: 'connected', sessions_captured: 5 }
    },
    active_workflows: 2,
    context_awareness: {
      current_project: 'steward-development',
      confidence: 0.94,
      last_context_update: '2024-01-15T10:45:00Z'
    },
    automation_status: {
      rules_active: 4,
      successful_automations: 23,
      pending_actions: 1,
      conflicts_detected: 0
    },
    performance_summary: {
      coordination_success_rate: 0.95,
      average_response_time: 1.8,
      cognitive_optimization_active: true,
      learning_improvements: 0.12
    },
    recent_activities: [
      {
        time: '10:45 AM',
        action: 'Context switch detected',
        apps: ['notion'],
        status: 'completed',
        description: 'Updated project context from Notion workspace'
      },
      {
        time: '10:42 AM', 
        action: 'Workflow coordination',
        apps: ['notion', 'things', 'apple_notes'],
        status: 'completed',
        description: 'Created task sequence and initialized session capture'
      },
      {
        time: '10:38 AM',
        action: 'Session capture',
        apps: ['apple_notes'],
        status: 'completed',
        description: 'Captured research session to project notes'
      },
      {
        time: '10:35 AM',
        action: 'Task completion sync',
        apps: ['things', 'notion'],
        status: 'completed',
        description: 'Synchronized task progress to project timeline'
      }
    ]
  };

  const currentStatus = ambientStatus || mockAmbientStatus;

  useEffect(() => {
    // Sync local state with props
    if (ambientStatus?.enabled !== undefined) {
      setAmbientEnabled(ambientStatus.enabled);
    }
  }, [ambientStatus]);

  const handleToggleAmbientIntelligence = () => {
    const newState = !ambientEnabled;
    setAmbientEnabled(newState);
    onToggleAmbientIntelligence(newState);
  };

  const getAppIcon = (appName) => {
    const icons = {
      notion: '📋',
      things: '✅', 
      apple_notes: '📝'
    };
    return icons[appName] || '🔗';
  };

  const getAppName = (appName) => {
    const names = {
      notion: 'Notion',
      things: 'Things 3',
      apple_notes: 'Apple Notes'
    };
    return names[appName] || appName;
  };

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

  const renderMainControls = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Box display="flex" alignItems="center">
            <SmartToyIcon color="primary" sx={{ mr: 1, fontSize: 32 }} />
            <Box>
              <Typography variant="h6">Ambient Intelligence</Typography>
              <Typography variant="body2" color="textSecondary">
                Cross-app workflow coordination and context awareness
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={ambientEnabled}
                  onChange={handleToggleAmbientIntelligence}
                  color="primary"
                />
              }
              label={ambientEnabled ? 'Active' : 'Disabled'}
            />
            <IconButton onClick={() => setSettingsDialog(true)}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {!ambientEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Ambient intelligence is disabled. Enable it to coordinate workflows across your productivity apps.
            </Typography>
          </Alert>
        )}

        {ambientEnabled && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  {Object.keys(currentStatus.apps_connected).length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Apps Connected
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="secondary">
                  {currentStatus.active_workflows}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Active Workflows
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="success.main">
                  {Math.round(currentStatus.performance_summary.coordination_success_rate * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" color="info.main">
                  {currentStatus.performance_summary.average_response_time}s
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Response Time
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );

  const renderContextAwareness = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PsychologyIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Context Awareness</Typography>
        </Box>

        {currentStatus.context_awareness ? (
          <Box>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="body1">
                Current Project: <strong>{currentStatus.context_awareness.current_project}</strong>
              </Typography>
              <Chip
                label={`${Math.round(currentStatus.context_awareness.confidence * 100)}% confidence`}
                color="success"
                size="small"
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={currentStatus.context_awareness.confidence * 100}
              color="success"
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            
            <Typography variant="caption" color="textSecondary">
              Last updated: {new Date(currentStatus.context_awareness.last_context_update).toLocaleTimeString()}
            </Typography>
          </Box>
        ) : (
          <Alert severity="warning">
            <Typography variant="body2">
              No project context detected. Connect to Notion or start a workflow to enable context awareness.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderConnectedApps = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <AppsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Connected Apps</Typography>
        </Box>

        <Grid container spacing={2}>
          {Object.entries(currentStatus.apps_connected).map(([appName, appData]) => (
            <Grid item xs={12} sm={4} key={appName}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  {getAppIcon(appName)}
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {getAppName(appName)}
                </Typography>
                <Chip
                  label={appData.status}
                  color={getStatusColor(appData.status)}
                  size="small"
                />
                
                {appData.context_detected && (
                  <Typography variant="caption" display="block" color="success.main" sx={{ mt: 1 }}>
                    ✓ Context detected
                  </Typography>
                )}
                {appData.tasks_synced && (
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                    {appData.tasks_synced} tasks synced
                  </Typography>
                )}
                {appData.sessions_captured && (
                  <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 1 }}>
                    {appData.sessions_captured} sessions captured
                  </Typography>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderAutomationRules = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center">
            <AutoAwesomeIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Automation Rules</Typography>
          </Box>
          <Badge badgeContent={currentStatus.automation_status.rules_active} color="primary">
            <CheckIcon color="success" />
          </Badge>
        </Box>

        <List>
          <ListItem>
            <ListItemIcon>
              <PlayIcon color={automationRules.session_start ? 'success' : 'disabled'} />
            </ListItemIcon>
            <ListItemText
              primary="Session Start Coordination"
              secondary="Detect context and prepare apps when Steward session begins"
            />
            <Switch
              checked={automationRules.session_start}
              onChange={(e) => setAutomationRules({
                ...automationRules,
                session_start: e.target.checked
              })}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <TimelineIcon color={automationRules.workflow_creation ? 'success' : 'disabled'} />
            </ListItemIcon>
            <ListItemText
              primary="Workflow Creation"
              secondary="Auto-create tasks and initialize session capture for new workflows"
            />
            <Switch
              checked={automationRules.workflow_creation}
              onChange={(e) => setAutomationRules({
                ...automationRules,
                workflow_creation: e.target.checked
              })}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <SyncIcon color={automationRules.context_change ? 'success' : 'disabled'} />
            </ListItemIcon>
            <ListItemText
              primary="Context Change Propagation"
              secondary="Sync context updates across all connected apps"
            />
            <Switch
              checked={automationRules.context_change}
              onChange={(e) => setAutomationRules({
                ...automationRules,
                context_change: e.target.checked
              })}
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <CheckIcon color={automationRules.session_completion ? 'success' : 'disabled'} />
            </ListItemIcon>
            <ListItemText
              primary="Session Completion"
              secondary="Capture results and update progress when sessions end"
            />
            <Switch
              checked={automationRules.session_completion}
              onChange={(e) => setAutomationRules({
                ...automationRules,
                session_completion: e.target.checked
              })}
            />
          </ListItem>
        </List>

        <Box mt={2} pt={2} borderTop={1} borderColor="divider">
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Successful automations: <strong>{currentStatus.automation_status.successful_automations}</strong>
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Pending actions: <strong>{currentStatus.automation_status.pending_actions}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );

  const renderRecentActivity = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Timeline color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Recent Activity</Typography>
        </Box>

        <List>
          {currentStatus.recent_activities.slice(0, 5).map((activity, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: activity.status === 'completed' ? 'success.main' :
                                   activity.status === 'pending' ? 'warning.main' : 'error.main'
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body2">{activity.action}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {activity.time}
                    </Typography>
                    <Box display="flex" gap={0.5}>
                      {activity.apps.map(app => (
                        <Typography key={app} variant="caption">
                          {getAppIcon(app)}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                }
                secondary={activity.description}
              />
            </ListItem>
          ))}
        </List>

        {currentStatus.recent_activities.length === 0 && (
          <Alert severity="info">
            <Typography variant="body2">
              No recent ambient intelligence activity. Enable automation rules to see activity here.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderQuickActions = () => (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" mb={2}>Quick Actions</Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={() => onTriggerWorkflowCoordination('manual')}
              disabled={!ambientEnabled}
            >
              Sync All Apps
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setActiveView('sync')}
              disabled={!ambientEnabled}
            >
              View Sync Status
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUpIcon />}
              onClick={() => setActiveView('analytics')}
            >
              View Analytics
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PsychologyIcon />}
              onClick={() => onTriggerWorkflowCoordination('cognitive_optimization')}
              disabled={!ambientEnabled}
            >
              Optimize Workflows
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderSettingsDialog = () => (
    <Dialog
      open={settingsDialog}
      onClose={() => setSettingsDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Ambient Intelligence Settings</DialogTitle>
      <DialogContent>
        <Box mt={2}>
          <Typography variant="h6" mb={2}>Automation Rules</Typography>
          {/* Detailed settings would go here */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Configure how ambient intelligence coordinates your workflows across apps.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setSettingsDialog(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => {
            onUpdateAutomationRules(automationRules);
            setSettingsDialog(false);
          }}
        >
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (activeView === 'sync') {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            variant="outlined"
            onClick={() => setActiveView('overview')}
            sx={{ mr: 2 }}
          >
            ← Back to Overview
          </Button>
          <Typography variant="h5">Cross-App Sync Status</Typography>
        </Box>
        <CrossAppSyncStatus
          syncStatus={currentStatus}
          onManualSync={() => {}}
          onResolveConflict={() => {}}
          onUpdateSyncSettings={() => {}}
        />
      </Box>
    );
  }

  if (activeView === 'analytics') {
    return (
      <Box>
        <Box display="flex" alignItems="center" mb={3}>
          <Button
            variant="outlined"
            onClick={() => setActiveView('overview')}
            sx={{ mr: 2 }}
          >
            ← Back to Overview
          </Button>
          <Typography variant="h5">Ambient Intelligence Analytics</Typography>
        </Box>
        <AmbientCoordinationAnalytics
          analyticsData={null}
          timeRange="7d"
          onTimeRangeChange={() => {}}
          onExportData={() => {}}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Main Controls */}
        <Grid item xs={12}>
          {renderMainControls()}
        </Grid>

        {/* Context Awareness */}
        <Grid item xs={12} md={6}>
          {renderContextAwareness()}
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          {renderQuickActions()}
        </Grid>

        {/* Connected Apps */}
        <Grid item xs={12}>
          {renderConnectedApps()}
        </Grid>

        {/* Automation Rules */}
        <Grid item xs={12} md={8}>
          {renderAutomationRules()}
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          {renderRecentActivity()}
        </Grid>
      </Grid>

      {/* Settings Dialog */}
      {renderSettingsDialog()}
    </Box>
  );
};

export default AmbientIntelligencePanel;

// #endregion end: Ambient Intelligence Panel
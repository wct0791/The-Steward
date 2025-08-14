// #region start: Autonomous Routing Control for The Steward
// Control panel for autonomous routing with oversight, approval, and override capabilities
// Displays autonomous decision history, accuracy metrics, and manual controls

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Switch,
  FormControlLabel,
  Slider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Paper,
  Divider
} from '@mui/material';
import {
  SmartToy as AutopilotIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Override as OverrideIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/**
 * AutonomousRoutingControl - Control panel for autonomous routing system
 * 
 * Features:
 * - Toggle autonomous routing for high-confidence decisions
 * - Review and approve/reject autonomous routing suggestions  
 * - Display autonomous decision history and accuracy
 * - Configure confidence thresholds for autonomous operation
 * - Emergency manual override controls
 * - Real-time monitoring of autonomous decisions
 */
const AutonomousRoutingControl = ({
  autonomousSettings = {},
  autonomousHistory = [],
  onSettingsChange = () => {},
  onDecisionFeedback = () => {},
  onOverrideDecision = () => {},
  onEmergencyStop = () => {}
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [autopilotEnabled, setAutopilotEnabled] = useState(autonomousSettings.autopilot_enabled || false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(autonomousSettings.confidence_threshold || 0.9);
  const [feedbackDialog, setFeedbackDialog] = useState(null);
  const [overrideDialog, setOverrideDialog] = useState(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  useEffect(() => {
    // Update local state when props change
    setAutopilotEnabled(autonomousSettings.autopilot_enabled || false);
    setConfidenceThreshold(autonomousSettings.confidence_threshold || 0.9);
  }, [autonomousSettings]);

  const handleAutopilotToggle = (enabled) => {
    setAutopilotEnabled(enabled);
    onSettingsChange({
      autopilot_enabled: enabled,
      confidence_threshold: confidenceThreshold
    });
  };

  const handleConfidenceChange = (newValue) => {
    setConfidenceThreshold(newValue);
    onSettingsChange({
      autopilot_enabled: autopilotEnabled,
      confidence_threshold: newValue
    });
  };

  const handleEmergencyStop = () => {
    setEmergencyMode(true);
    setAutopilotEnabled(false);
    onEmergencyStop();
  };

  const renderControlPanel = () => {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <AutopilotIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Autonomous Routing Control</Typography>
            </Box>
            
            {emergencyMode && (
              <Alert severity="warning" sx={{ ml: 2 }}>
                Emergency Stop Active
              </Alert>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Main Controls */}
            <Grid item xs={12} md={6}>
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autopilotEnabled && !emergencyMode}
                      onChange={(e) => handleAutopilotToggle(e.target.checked)}
                      disabled={emergencyMode}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Autonomous Routing {autopilotEnabled && !emergencyMode ? 'Enabled' : 'Disabled'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        High-confidence decisions made automatically
                      </Typography>
                    </Box>
                  }
                />

                <Box mt={3}>
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                  </Typography>
                  <Slider
                    value={confidenceThreshold}
                    onChange={(e, newValue) => handleConfidenceChange(newValue)}
                    min={0.7}
                    max={0.99}
                    step={0.01}
                    disabled={emergencyMode}
                    marks={[
                      { value: 0.7, label: '70%' },
                      { value: 0.8, label: '80%' },
                      { value: 0.9, label: '90%' },
                      { value: 0.95, label: '95%' }
                    ]}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Only decisions above this confidence will be automated
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Status Indicators */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" mb={2}>System Status</Typography>
                
                <Box display="flex" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" flex={1}>
                    {autopilotEnabled && !emergencyMode ? (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    ) : (
                      <StopIcon color="error" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="body2">
                      Autopilot: {autopilotEnabled && !emergencyMode ? 'Active' : 'Inactive'}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <SecurityIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    High-Confidence Patterns: {autonomousSettings.high_confidence_patterns || 0}
                  </Typography>
                </Box>

                <Box display="flex" alignItems="center">
                  <SpeedIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Success Rate: {Math.round((autonomousSettings.success_rate || 0) * 100)}%
                  </Typography>
                </Box>
              </Paper>

              {/* Emergency Controls */}
              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={handleEmergencyStop}
                  disabled={emergencyMode}
                  fullWidth
                >
                  Emergency Stop
                </Button>
                
                {emergencyMode && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayIcon />}
                    onClick={() => setEmergencyMode(false)}
                    fullWidth
                    sx={{ mt: 1 }}
                  >
                    Resume Operations
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderDecisionHistory = () => {
    const recentDecisions = autonomousHistory.slice(0, 10);

    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" mb={2}>Recent Autonomous Decisions</Typography>
          
          {recentDecisions.length === 0 ? (
            <Alert severity="info">
              No autonomous decisions recorded yet. Enable autopilot to begin autonomous routing.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Model Selected</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentDecisions.map((decision) => (
                    <TableRow key={decision.id} hover>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(decision.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={decision.project_context || 'Unknown'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {decision.selected_model}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box display="flex" alignItems="center" justifyContent="flex-end">
                          <LinearProgress
                            variant="determinate"
                            value={decision.autonomous_confidence * 100}
                            sx={{ width: 40, mr: 1 }}
                          />
                          <Typography variant="caption">
                            {Math.round(decision.autonomous_confidence * 100)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={decision.user_reviewed ? 'Reviewed' : 'Pending'}
                          color={decision.user_reviewed ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          {!decision.user_reviewed && (
                            <>
                              <Tooltip title="Approve Decision">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => setFeedbackDialog(decision)}
                                >
                                  <ThumbUpIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Override Decision">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => setOverrideDialog(decision)}
                                >
                                  <OverrideIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderPerformanceMetrics = () => {
    // Mock performance data - would come from real metrics
    const performanceData = [
      { name: 'Week 1', autonomous: 85, manual: 78 },
      { name: 'Week 2', autonomous: 88, manual: 82 },
      { name: 'Week 3', autonomous: 92, manual: 80 },
      { name: 'Week 4', autonomous: 89, manual: 84 }
    ];

    const decisionTypeData = [
      { name: 'Autonomous', value: 65, color: '#0088FE' },
      { name: 'Manual', value: 35, color: '#00C49F' }
    ];

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" mb={2}>Performance Comparison</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="autonomous"
                    stroke="#1976d2"
                    strokeWidth={2}
                    name="Autonomous Routing"
                  />
                  <Line
                    type="monotone"
                    dataKey="manual"
                    stroke="#ff7300"
                    strokeWidth={2}
                    name="Manual Routing"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" mb={2}>Decision Distribution</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={decisionTypeData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {decisionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" mb={1}>Key Metrics</Typography>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Override Rate:</Typography>
                  <Typography variant="body2" color="error">
                    {Math.round((autonomousSettings.override_rate || 0) * 100)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Time Saved:</Typography>
                  <Typography variant="body2" color="success.main">
                    ~2.3 hrs/week
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">User Satisfaction:</Typography>
                  <Typography variant="body2" color="primary">
                    {Math.round((autonomousSettings.success_rate || 0) * 100)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderFeedbackDialog = () => {
    const [feedbackData, setFeedbackData] = useState({
      success: true,
      rating: 4,
      comments: ''
    });

    if (!feedbackDialog) return null;

    return (
      <Dialog
        open={!!feedbackDialog}
        onClose={() => setFeedbackDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Provide Feedback on Autonomous Decision</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Decision: {feedbackDialog.selected_model} for {feedbackDialog.project_context}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={feedbackData.success}
                  onChange={(e) => setFeedbackData({
                    ...feedbackData,
                    success: e.target.checked
                  })}
                />
              }
              label="Decision was correct"
            />

            <Box mt={2}>
              <Typography variant="body2" mb={1}>
                Overall Rating: {feedbackData.rating}/5
              </Typography>
              <Slider
                value={feedbackData.rating}
                onChange={(e, newValue) => setFeedbackData({
                  ...feedbackData,
                  rating: newValue
                })}
                min={1}
                max={5}
                step={1}
                marks
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Comments"
              value={feedbackData.comments}
              onChange={(e) => setFeedbackData({
                ...feedbackData,
                comments: e.target.value
              })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onDecisionFeedback(feedbackDialog.id, feedbackData);
              setFeedbackDialog(null);
            }}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderOverrideDialog = () => {
    const [overrideData, setOverrideData] = useState({
      new_model: '',
      reason: ''
    });

    if (!overrideDialog) return null;

    return (
      <Dialog
        open={!!overrideDialog}
        onClose={() => setOverrideDialog(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Override Autonomous Decision</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Override will reduce confidence in this routing pattern and may affect future autonomous decisions.
            </Alert>

            <Typography variant="body2" color="textSecondary" mb={2}>
              Current Selection: {overrideDialog.selected_model}
            </Typography>

            <TextField
              fullWidth
              label="New Model Selection"
              value={overrideData.new_model}
              onChange={(e) => setOverrideData({
                ...overrideData,
                new_model: e.target.value
              })}
              margin="normal"
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Override Reason"
              value={overrideData.reason}
              onChange={(e) => setOverrideData({
                ...overrideData,
                reason: e.target.value
              })}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOverrideDialog(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!overrideData.new_model || !overrideData.reason}
            onClick={() => {
              onOverrideDecision(overrideDialog.id, overrideData);
              setOverrideDialog(null);
            }}
          >
            Override Decision
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const tabContent = [
    {
      label: 'Control Panel',
      content: renderControlPanel()
    },
    {
      label: 'Decision History',
      content: renderDecisionHistory()
    },
    {
      label: 'Performance',
      content: renderPerformanceMetrics()
    }
  ];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <AutopilotIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5">Autonomous Routing</Typography>
        <Tooltip title="AI-powered automatic routing for high-confidence decisions">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box mb={2}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          {tabContent.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      <Box>
        {tabContent[activeTab]?.content}
      </Box>

      {/* Dialogs */}
      {renderFeedbackDialog()}
      {renderOverrideDialog()}
    </Box>
  );
};

export default AutonomousRoutingControl;

// #endregion end: Autonomous Routing Control
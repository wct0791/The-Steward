// #region start: Cognitive Optimization Guide for The Steward
// Real-time cognitive load monitoring and suggestions for ADHD-aware productivity
// Hyperfocus cycle tracking and break recommendations with context switching analysis

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
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Badge
} from '@mui/material';
import {
  Psychology as BrainIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Lightbulb as LightbulbIcon,
  Timer as TimerIcon,
  Pause as PauseIcon,
  Speed as SpeedIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  NotificationsActive as NotificationIcon,
  Mood as MoodIcon,
  Battery as BatteryIcon,
  SwapHoriz as SwitchIcon,
  Focus as FocusIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

/**
 * CognitiveOptimizationGuide - Real-time cognitive monitoring and optimization
 * 
 * Features:
 * - Real-time cognitive load monitoring with capacity predictions
 * - Hyperfocus cycle tracking with break recommendations
 * - Context switching cost analysis and mitigation strategies
 * - ADHD-aware productivity suggestions and accommodations
 * - Visual cognitive capacity timeline and optimization alerts
 */
const CognitiveOptimizationGuide = ({
  currentCognitiveState = {},
  cognitiveHistory = [],
  hyperfocusPredictions = null,
  contextSwitchingAnalysis = {},
  onOptimizationAction = () => {},
  onBreakRecommendation = () => {},
  autoMonitoringEnabled = true,
  onSettingsChange = () => {}
}) => {
  const [activeAccordion, setActiveAccordion] = useState('capacity');
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(autoMonitoringEnabled);
  const [breakAlerts, setBreakAlerts] = useState(true);
  const [hyperfocusMode, setHyperfocusMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update current time every minute for real-time monitoring
    if (realTimeMonitoring) {
      const interval = setInterval(() => setCurrentTime(new Date()), 60000);
      return () => clearInterval(interval);
    }
  }, [realTimeMonitoring]);

  const getCurrentCapacityLevel = () => {
    const capacity = currentCognitiveState.predicted_capacity || 0.7;
    if (capacity >= 0.8) return { level: 'high', color: 'success', label: 'Peak Capacity' };
    if (capacity >= 0.6) return { level: 'good', color: 'primary', label: 'Good Capacity' };
    if (capacity >= 0.4) return { level: 'moderate', color: 'warning', label: 'Moderate Capacity' };
    return { level: 'low', color: 'error', label: 'Low Capacity' };
  };

  const renderCapacityOverview = () => {
    const capacityInfo = getCurrentCapacityLevel();
    const currentCapacity = currentCognitiveState.predicted_capacity || 0.7;
    const confidence = currentCognitiveState.confidence || 0.6;

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <BrainIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Current Cognitive State</Typography>
            </Box>
            
            <Badge 
              badgeContent={realTimeMonitoring ? "Live" : "Static"} 
              color={realTimeMonitoring ? "success" : "default"}
            >
              <IconButton 
                onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
                color={realTimeMonitoring ? "primary" : "default"}
              >
                <RefreshIcon />
              </IconButton>
            </Badge>
          </Box>

          <Grid container spacing={3}>
            {/* Current Capacity Display */}
            <Grid item xs={12} md={6}>
              <Box textAlign="center" p={2}>
                <Typography variant="h3" color={`${capacityInfo.color}.main`} mb={1}>
                  {Math.round(currentCapacity * 100)}%
                </Typography>
                <Typography variant="h6" color="textSecondary" mb={2}>
                  {capacityInfo.label}
                </Typography>
                
                <LinearProgress
                  variant="determinate"
                  value={currentCapacity * 100}
                  color={capacityInfo.color}
                  sx={{ height: 12, borderRadius: 6, mb: 2 }}
                />
                
                <Typography variant="body2" color="textSecondary">
                  Prediction Confidence: {Math.round(confidence * 100)}%
                </Typography>
              </Box>
            </Grid>

            {/* Capacity Factors */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" mb={2}>Contributing Factors</Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Time of Day</Typography>
                  <Typography variant="body2" color="primary">
                    {Math.round((currentCognitiveState.time_of_day_factor || 1.0) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(currentCognitiveState.time_of_day_factor || 1.0) * 100}
                  size="small"
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Task Complexity Impact</Typography>
                  <Typography variant="body2" color="secondary">
                    {Math.round((currentCognitiveState.complexity_factor || 1.0) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(currentCognitiveState.complexity_factor || 1.0) * 100}
                  color="secondary"
                  size="small"
                />
              </Box>

              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Context Switching Penalty</Typography>
                  <Typography variant="body2" color="error">
                    -{Math.round((currentCognitiveState.switching_penalty || 0) * 100)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(currentCognitiveState.switching_penalty || 0) * 100}
                  color="error"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Current Recommendations */}
          {currentCognitiveState.recommendations && currentCognitiveState.recommendations.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle1" mb={2}>Real-time Recommendations</Typography>
              {currentCognitiveState.recommendations.slice(0, 2).map((rec, index) => (
                <Alert 
                  key={index}
                  severity={rec.priority === 'high' ? 'warning' : 'info'}
                  sx={{ mb: 1 }}
                  action={
                    rec.type === 'adhd_accommodation' && (
                      <Button 
                        color="inherit" 
                        size="small"
                        onClick={() => onOptimizationAction(rec)}
                      >
                        Apply
                      </Button>
                    )
                  }
                >
                  <Typography variant="body2">{rec.message}</Typography>
                </Alert>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderHyperfocusTracking = () => {
    const nextHyperfocus = hyperfocusPredictions?.next_hyperfocus_window;
    const isHyperfocusDetected = currentCognitiveState.hyperfocus_detected;
    const hyperfocusHistory = cognitiveHistory.filter(h => h.hyperfocus_detected);

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <FocusIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Hyperfocus Cycle Tracking</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={hyperfocusMode}
                  onChange={(e) => setHyperfocusMode(e.target.checked)}
                  color="primary"
                />
              }
              label="Hyperfocus Mode"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Current Hyperfocus Status */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                {isHyperfocusDetected ? (
                  <Box>
                    <MoodIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" color="success.main" mb={1}>
                      Hyperfocus Active
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Peak concentration detected - minimize interruptions
                    </Typography>
                    <Button
                      startIcon={<NotificationIcon />}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 2 }}
                      onClick={() => onOptimizationAction({ type: 'protect_hyperfocus' })}
                    >
                      Protect Session
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <BatteryIcon sx={{ fontSize: 48, color: 'action.disabled', mb: 1 }} />
                    <Typography variant="h6" color="textSecondary" mb={1}>
                      Normal Focus State
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Next predicted hyperfocus in{' '}
                      {nextHyperfocus ? new Date(nextHyperfocus.start_time).toLocaleTimeString() : '~2 hours'}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Hyperfocus Predictions */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" mb={2}>Cycle Predictions</Typography>
              
              {nextHyperfocus && (
                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" mb={1}>
                    Next Window
                  </Typography>
                  <Box display="flex" alignItems="center" mb={1}>
                    <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {new Date(nextHyperfocus.start_time).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1}>
                    <TimerIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Duration: ~{nextHyperfocus.estimated_duration || 120} minutes
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Probability: {Math.round((nextHyperfocus.probability || 0.7) * 100)}%
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2" color="textSecondary" mb={1}>
                Weekly Pattern
              </Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="caption">Morning: 70%</Typography>
                <Typography variant="caption">Afternoon: 40%</Typography>
                <Typography variant="caption">Evening: 30%</Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Hyperfocus Recommendations */}
          {hyperfocusPredictions?.recommendations && (
            <Box mt={3}>
              <Typography variant="subtitle1" mb={2}>Hyperfocus Optimization</Typography>
              <List dense>
                {hyperfocusPredictions.recommendations.slice(0, 3).map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <LightbulbIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.message}
                      secondary={`Timing: ${rec.timing}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderContextSwitchingAnalysis = () => {
    const switchingCost = contextSwitchingAnalysis.switching_cost || 0.15;
    const recoveryTime = contextSwitchingAnalysis.recovery_time_minutes || 10;
    const severity = contextSwitchingAnalysis.severity || 'moderate';

    const getSeverityColor = (sev) => {
      switch (sev) {
        case 'minimal': return 'success';
        case 'moderate': return 'warning';
        case 'significant': return 'error';
        case 'high': return 'error';
        default: return 'warning';
      }
    };

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <SwitchIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Context Switching Analysis</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Switching Cost Overview */}
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color={`${getSeverityColor(severity)}.main`} mb={1}>
                  {Math.round(switchingCost * 100)}%
                </Typography>
                <Typography variant="body1" mb={1}>
                  Switching Cost
                </Typography>
                <Chip 
                  label={severity.toUpperCase()} 
                  color={getSeverityColor(severity)} 
                  size="small"
                />
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary" mb={1}>
                  {recoveryTime}
                </Typography>
                <Typography variant="body1" mb={1}>
                  Recovery Minutes
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Time to regain focus
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="secondary" mb={1}>
                  {Math.round((contextSwitchingAnalysis.context_distance || 0.5) * 100)}%
                </Typography>
                <Typography variant="body1" mb={1}>
                  Context Distance
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Dissimilarity factor
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Mitigation Strategies */}
          {contextSwitchingAnalysis.mitigation_strategies && (
            <Box mt={3}>
              <Typography variant="subtitle1" mb={2}>Mitigation Strategies</Typography>
              <List dense>
                {contextSwitchingAnalysis.mitigation_strategies.map((strategy, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={strategy}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Context Switching History Chart */}
          <Box mt={3}>
            <Typography variant="subtitle1" mb={2}>Recent Switching Pattern</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cognitiveHistory.slice(-7).map((item, index) => ({
                day: `Day ${index + 1}`,
                switches: item.context_switches || Math.floor(Math.random() * 10),
                cost: item.switching_cost || Math.random() * 0.3
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Bar dataKey="switches" fill="#1976d2" name="Context Switches" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderBreakRecommendations = () => {
    const needsBreak = currentCognitiveState.predicted_capacity < 0.5 || 
                      currentCognitiveState.switching_penalty > 0.3;
    const timeSinceLastBreak = 45; // Mock data - minutes since last break

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center">
              <PauseIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Break Recommendations</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={breakAlerts}
                  onChange={(e) => setBreakAlerts(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto Alerts"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Break Status */}
            <Grid item xs={12} md={6}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  borderColor: needsBreak ? 'warning.main' : 'success.main',
                  bgcolor: needsBreak ? 'warning.lighter' : 'success.lighter'
                }}
              >
                {needsBreak ? (
                  <Box>
                    <WarningIcon sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h6" color="warning.main" mb={1}>
                      Break Recommended
                    </Typography>
                    <Typography variant="body2" mb={2}>
                      Cognitive capacity is declining
                    </Typography>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<TimerIcon />}
                      onClick={() => onBreakRecommendation({ type: 'immediate', duration: 15 })}
                    >
                      Take 15min Break
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="h6" color="success.main" mb={1}>
                      Good Focus State
                    </Typography>
                    <Typography variant="body2">
                      Next break suggested in ~30 minutes
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Break Timing Analysis */}
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" mb={2}>Break Timing</Typography>
              
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Time Since Last Break</Typography>
                  <Typography variant="body2" color={timeSinceLastBreak > 60 ? 'error' : 'textPrimary'}>
                    {timeSinceLastBreak} min
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (timeSinceLastBreak / 90) * 100)}
                  color={timeSinceLastBreak > 60 ? 'error' : 'primary'}
                />
              </Box>

              <Typography variant="body2" color="textSecondary" mb={2}>
                Recommended Break Types
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TimerIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="5-min Micro Break"
                    secondary="Every 25 minutes of focused work"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <PauseIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="15-min Active Break"
                    secondary="Every 90 minutes or after high cognitive load"
                  />
                </ListItem>
              </List>
            </Grid>
          </Grid>

          {/* Break Activity Suggestions */}
          <Box mt={3}>
            <Typography variant="subtitle1" mb={2}>Suggested Break Activities</Typography>
            <Grid container spacing={2}>
              {[
                { activity: 'Deep Breathing', duration: '2-3 min', benefit: 'Reduces stress' },
                { activity: 'Light Stretching', duration: '5 min', benefit: 'Physical reset' },
                { activity: 'Hydration', duration: '1 min', benefit: 'Cognitive boost' },
                { activity: 'Fresh Air', duration: '5-10 min', benefit: 'Mental clarity' }
              ].map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight="medium" mb={1}>
                      {item.activity}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {item.duration}
                    </Typography>
                    <Typography variant="caption" color="primary">
                      {item.benefit}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCapacityTimeline = () => {
    // Generate timeline data for the day
    const timelineData = Array.from({ length: 14 }, (_, i) => {
      const hour = i + 8; // 8 AM to 10 PM
      const baseCapacity = hour >= 9 && hour <= 10 ? 0.9 :
                          hour >= 14 && hour <= 15 ? 0.8 :
                          hour >= 12 && hour <= 13 ? 0.5 :
                          hour >= 21 ? 0.4 : 0.7;
      
      return {
        hour: `${hour}:00`,
        predicted: baseCapacity + (Math.random() - 0.5) * 0.2,
        actual: i <= 6 ? baseCapacity + (Math.random() - 0.5) * 0.15 : null,
        optimal: 0.8
      };
    });

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <SpeedIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Daily Cognitive Capacity Timeline</Typography>
            <Tooltip title="Predicted vs actual cognitive capacity throughout the day">
              <IconButton size="small" sx={{ ml: 1 }}>
                <LightbulbIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis domain={[0, 1]} />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#1976d2"
                strokeWidth={2}
                name="Predicted Capacity"
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#2e7d32"
                strokeWidth={3}
                name="Actual Capacity"
              />
              <Line
                type="monotone"
                dataKey="optimal"
                stroke="#ff9800"
                strokeWidth={1}
                name="Optimal Threshold"
                strokeDasharray="2 2"
              />
            </LineChart>
          </ResponsiveContainer>

          <Box mt={2} display="flex" justifyContent="center" gap={3}>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 3, bgcolor: '#1976d2', mr: 1 }} />
              <Typography variant="caption">Predicted</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 3, bgcolor: '#2e7d32', mr: 1 }} />
              <Typography variant="caption">Actual</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 3, bgcolor: '#ff9800', mr: 1 }} />
              <Typography variant="caption">Optimal</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const accordionContent = {
    capacity: { title: 'Cognitive Capacity', content: renderCapacityOverview() },
    hyperfocus: { title: 'Hyperfocus Tracking', content: renderHyperfocusTracking() },
    switching: { title: 'Context Switching', content: renderContextSwitchingAnalysis() },
    breaks: { title: 'Break Recommendations', content: renderBreakRecommendations() },
    timeline: { title: 'Daily Timeline', content: renderCapacityTimeline() }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <BrainIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Cognitive Optimization Guide</Typography>
          <Tooltip title="ADHD-aware cognitive load monitoring and productivity optimization">
            <IconButton size="small" sx={{ ml: 1 }}>
              <LightbulbIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant={realTimeMonitoring ? 'contained' : 'outlined'}
            startIcon={<RefreshIcon />}
            onClick={() => {
              setRealTimeMonitoring(!realTimeMonitoring);
              onSettingsChange({ realTimeMonitoring: !realTimeMonitoring });
            }}
            size="small"
          >
            Live Monitoring
          </Button>
        </Box>
      </Box>

      {/* Quick Status Overview */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {Math.round((currentCognitiveState.predicted_capacity || 0.7) * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Current Capacity
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color={currentCognitiveState.hyperfocus_detected ? 'success' : 'textSecondary'}>
              {currentCognitiveState.hyperfocus_detected ? 'Active' : 'Normal'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Hyperfocus State
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {Math.round((contextSwitchingAnalysis.switching_cost || 0.15) * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Switching Cost
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color={needsBreak ? 'error' : 'success'}>
              {needsBreak ? 'Needed' : 'Good'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Break Status
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Sections */}
      <Box>
        {Object.entries(accordionContent).map(([key, section]) => (
          <Accordion
            key={key}
            expanded={activeAccordion === key}
            onChange={() => setActiveAccordion(activeAccordion === key ? '' : key)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">{section.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {section.content}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
};

export default CognitiveOptimizationGuide;

// #endregion end: Cognitive Optimization Guide
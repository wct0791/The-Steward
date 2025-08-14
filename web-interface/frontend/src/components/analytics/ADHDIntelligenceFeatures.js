// ADHD-Aware Intelligence Features
// Cognitive pattern recognition and accommodation effectiveness tracking

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Psychology as BrainIcon,
  AutoAwesome as HyperfocusIcon,
  Speed as SpeedIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Settings as SettingsIcon,
  Lightbulb as InsightIcon,
  Timer as TimerIcon,
  ShowChart as PatternIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { ApiService } from '../../services/api';

const ADHDIntelligenceFeatures = () => {
  const [cognitivePatterns, setCognitivePatterns] = useState([]);
  const [accommodationEffectiveness, setAccommodationEffectiveness] = useState([]);
  const [hyperfocusSessions, setHyperfocusSessions] = useState([]);
  const [contextSwitchingData, setContextSwitchingData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('7d');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [accommodationSettings, setAccommodationSettings] = useState({
    hyperfocus_detection: true,
    fast_local_routing: true,
    context_switch_management: true,
    distraction_mitigation: true
  });

  useEffect(() => {
    loadADHDIntelligenceData();
  }, [timeframe]);

  const loadADHDIntelligenceData = async () => {
    try {
      setLoading(true);
      
      const [cognitiveData, accommodationData] = await Promise.all([
        ApiService.request('GET', `/api/analytics/cognitive-patterns-enhanced?timeframe=${timeframe}`),
        ApiService.request('GET', `/api/analytics/adhd-accommodations?timeframe=${timeframe}`)
      ]);
      
      setCognitivePatterns(cognitiveData.cognitive_patterns || []);
      setAccommodationEffectiveness(cognitiveData.adhd_accommodations || []);
      setInsights(cognitiveData.insights || []);
      
      // Process hyperfocus sessions
      const hyperfocusData = cognitiveData.cognitive_patterns?.filter(p => p.hyperfocus_detected) || [];
      setHyperfocusSessions(hyperfocusData);
      
      // Generate context switching tolerance data
      generateContextSwitchingData();
      
    } catch (error) {
      console.error('Error loading ADHD intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateContextSwitchingData = () => {
    // Simulate context switching tolerance based on ADHD research
    const data = [
      { task_count: 1, productivity: 95, cognitive_load: 1.2, success_rate: 0.98 },
      { task_count: 2, productivity: 88, cognitive_load: 1.8, success_rate: 0.91 },
      { task_count: 3, productivity: 82, cognitive_load: 2.5, success_rate: 0.85 },
      { task_count: 4, productivity: 75, cognitive_load: 3.2, success_rate: 0.78 }, // Sweet spot limit
      { task_count: 5, productivity: 65, cognitive_load: 4.1, success_rate: 0.68 },
      { task_count: 6, productivity: 50, cognitive_load: 4.8, success_rate: 0.55 },
      { task_count: 7, productivity: 35, cognitive_load: 5.0, success_rate: 0.42 }
    ];
    setContextSwitchingData(data);
  };

  const getCognitiveLoadColor = (load) => {
    if (load <= 2) return '#4caf50';
    if (load <= 3) return '#ff9800';
    return '#f44336';
  };

  const getEffectivenessColor = (effectiveness) => {
    if (effectiveness >= 0.85) return 'success';
    if (effectiveness >= 0.70) return 'warning';
    return 'error';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUpIcon color="success" />;
    if (trend === 'declining') return <TrendingDownIcon color="error" />;
    return <SpeedIcon color="action" />;
  };

  const formatHour = (hour) => {
    return `${hour}:00`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BrainIcon color="primary" />
            🧠 ADHD Intelligence & Accommodations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Cognitive pattern recognition and personalized accommodation effectiveness
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showAdvancedMetrics}
                onChange={(e) => setShowAdvancedMetrics(e.target.checked)}
                size="small"
              />
            }
            label="Advanced"
          />
          <IconButton onClick={loadADHDIntelligenceData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* Accommodation Effectiveness Cards */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesome color="primary" />
            Accommodation Effectiveness
          </Typography>
          <Grid container spacing={2}>
            {accommodationEffectiveness.map((accommodation, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {accommodation.type}
                      </Typography>
                      {getTrendIcon(accommodation.trend)}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" 
                        color={`${getEffectivenessColor(accommodation.effectiveness)}.main`}
                        sx={{ fontWeight: 600 }}
                      >
                        {Math.round(accommodation.effectiveness * 100)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Effectiveness
                      </Typography>
                    </Box>
                    
                    <LinearProgress
                      variant="determinate"
                      value={accommodation.effectiveness * 100}
                      color={getEffectivenessColor(accommodation.effectiveness)}
                      sx={{ mb: 1, height: 6 }}
                    />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {accommodation.description}
                    </Typography>
                    
                    <Chip
                      label={`Used ${accommodation.usage_count} times`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Cognitive Load Patterns */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PatternIcon />
                Cognitive Load Throughout Day
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Understanding your cognitive patterns helps optimize model routing
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cognitivePatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={formatHour}
                  />
                  <YAxis 
                    domain={[1, 5]}
                    tickFormatter={(value) => `${value}/5`}
                  />
                  <RechartsTooltip 
                    labelFormatter={(hour) => `Time: ${formatHour(hour)}`}
                    formatter={(value, name) => [
                      `${value.toFixed(1)}/5`,
                      name === 'cognitive_load' ? 'Cognitive Load' : 'Context Switches'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="cognitive_load"
                    stroke="#9c27b0"
                    fill="#9c27b0"
                    fillOpacity={0.6}
                    name="cognitive_load"
                  />
                  <Area
                    type="monotone"
                    dataKey="context_switches"
                    stroke="#ff5722"
                    fill="#ff5722"
                    fillOpacity={0.3}
                    name="context_switches"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Hyperfocus Detection */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HyperfocusIcon color="secondary" />
                Hyperfocus Detection
              </Typography>
              
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="h3" color="secondary.main" sx={{ fontWeight: 600 }}>
                  {hyperfocusSessions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sessions detected this {timeframe === '24h' ? 'day' : timeframe === '7d' ? 'week' : 'month'}
                </Typography>
              </Box>
              
              {hyperfocusSessions.length > 0 ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    🎯 Hyperfocus periods are optimal for complex tasks like debugging and analysis.
                  </Alert>
                  
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Recent Hyperfocus Sessions:
                  </Typography>
                  
                  {hyperfocusSessions.slice(0, 3).map((session, index) => (
                    <Chip
                      key={index}
                      label={`${formatHour(session.hour)} (${session.request_count} tasks)`}
                      size="small"
                      color="secondary"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No hyperfocus sessions detected yet. Keep working to build your cognitive profile!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Context Switching Tolerance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimerIcon />
                Context Switching Tolerance (ADHD 3-4 Task Pattern)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your productivity vs concurrent task count - optimized for ADHD cognitive patterns
              </Typography>
              
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={contextSwitchingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="task_count" />
                  <YAxis 
                    yAxisId="left"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    domain={[1, 5]}
                    tickFormatter={(value) => `${value}/5`}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => {
                      if (name === 'productivity') return [`${value}%`, 'Productivity'];
                      if (name === 'cognitive_load') return [`${value}/5`, 'Cognitive Load'];
                      return [`${(value * 100).toFixed(0)}%`, 'Success Rate'];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="productivity"
                    stroke="#4caf50"
                    fill="#4caf50"
                    fillOpacity={0.6}
                    name="productivity"
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="cognitive_load"
                    stroke="#f44336"
                    fill="#f44336"
                    fillOpacity={0.3}
                    name="cognitive_load"
                  />
                </AreaChart>
              </ResponsiveContainer>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>ADHD Sweet Spot:</strong> Optimal performance at 3-4 concurrent tasks. 
                  The Steward will automatically manage context switching to keep you in this zone.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Cognitive Insights */}
        {insights.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsightIcon />
                  Cognitive Insights & Recommendations
                </Typography>
                
                {insights.map((insight, index) => (
                  <Alert
                    key={index}
                    severity={insight.actionable ? 'success' : 'info'}
                    sx={{ mb: 2 }}
                    action={
                      insight.actionable && (
                        <Button color="inherit" size="small">
                          Apply
                        </Button>
                      )
                    }
                  >
                    <Typography variant="body2">
                      <strong>{insight.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                      {' '}{insight.message}
                    </Typography>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Advanced Metrics (when enabled) */}
        {showAdvancedMetrics && (
          <Grid item xs={12}>
            <Card sx={{ border: '2px dashed #9c27b0' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SettingsIcon color="secondary" />
                  Advanced ADHD Metrics
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Distraction Patterns
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip label="Morning: Low" color="success" size="small" />
                      <Chip label="Afternoon: Medium" color="warning" size="small" />
                      <Chip label="Evening: High" color="error" size="small" />
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Optimal Model Selection Times
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="9-11 AM: Complex models (GPT-4, Claude)"
                          secondary="Peak cognitive performance window"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="2-4 PM: Local models (SmolLM3)"
                          secondary="Post-lunch cognitive dip"
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="7-9 PM: Uncensored/creative models"
                          secondary="Evening creativity boost"
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Accommodation Settings
                    </Typography>
                    
                    {Object.entries(accommodationSettings).map(([key, value]) => (
                      <FormControlLabel
                        key={key}
                        control={
                          <Switch
                            checked={value}
                            onChange={(e) => 
                              setAccommodationSettings({
                                ...accommodationSettings,
                                [key]: e.target.checked
                              })
                            }
                            size="small"
                          />
                        }
                        label={key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        sx={{ display: 'block', mb: 1 }}
                      />
                    ))}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ADHDIntelligenceFeatures;
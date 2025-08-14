// #region start: Context Switching Analysis for ADHD-Aware Routing
// Visualizes context switching patterns and ADHD accommodations
// Tracks rapid switching, hyperfocus, and cognitive capacity variance

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Alert,
  Grid,
  LinearProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge
} from '@mui/material';
import { 
  Psychology as PsychologyIcon,
  FlashOn as FlashOnIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Focus as FocusIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts';

/**
 * ContextSwitchingAnalysis - ADHD-aware context switching pattern analysis
 * 
 * Features:
 * - Real-time context switching detection
 * - Rapid switching vs hyperfocus identification
 * - ADHD accommodation recommendations
 * - Cognitive capacity tracking over time
 */
const ContextSwitchingAnalysis = ({ 
  memoryInsights = null, 
  routingDecisions = [], 
  onAccommodationChange = () => {},
  accommodationSettings = {}
}) => {
  const [switchingPattern, setSwitchingPattern] = useState(null);
  const [accommodationStatus, setAccommodationStatus] = useState({});
  const [capacityTrend, setCapacityTrend] = useState([]);
  const [recentContexts, setRecentContexts] = useState([]);

  useEffect(() => {
    if (memoryInsights?.available && memoryInsights.context_switching) {
      processSwitchingData();
    }
  }, [memoryInsights, routingDecisions]);

  const processSwitchingData = () => {
    const switchingData = memoryInsights.context_switching;
    
    // Set switching pattern analysis
    setSwitchingPattern({
      is_rapid_switching: switchingData.is_rapid_switching || false,
      is_hyperfocus: switchingData.is_hyperfocus || false,
      switch_frequency: switchingData.switch_frequency || 0,
      recent_contexts: switchingData.recent_contexts || [],
      pattern_confidence: switchingData.pattern_confidence || 0.5
    });

    // Process recent context changes
    const contexts = switchingData.recent_session_contexts || {};
    const contextList = Object.entries(contexts).map(([context, count]) => ({
      context: context,
      count: count,
      percentage: contexts.total_recent_decisions ? 
        (count / Object.values(contexts).reduce((a, b) => a + b, 0)) * 100 : 0
    }));
    setRecentContexts(contextList);

    // Generate capacity trend from recent routing decisions
    if (routingDecisions.length > 0) {
      const trend = routingDecisions.slice(-20).map((decision, index) => {
        const contextAnalysis = decision.memory_integration?.context_analysis;
        const capacity = contextAnalysis?.cognitive_capacity?.level || 'medium';
        const capacityScore = capacity === 'high' ? 0.8 : capacity === 'medium' ? 0.5 : 0.2;
        
        return {
          index: index + 1,
          capacity: capacityScore,
          switching: contextAnalysis?.context_switching?.switch_frequency || 0,
          timestamp: decision.timestamp
        };
      });
      setCapacityTrend(trend);
    }

    // Update accommodation status
    setAccommodationStatus({
      simplified_routing: switchingData.is_rapid_switching,
      enhanced_context_memory: switchingData.is_hyperfocus,
      capacity_aware: true
    });
  };

  const getSwitchingPatternColor = () => {
    if (!switchingPattern) return 'default';
    
    if (switchingPattern.is_rapid_switching) return 'error';
    if (switchingPattern.is_hyperfocus) return 'info';
    return 'success';
  };

  const getSwitchingPatternIcon = () => {
    if (!switchingPattern) return <PsychologyIcon />;
    
    if (switchingPattern.is_rapid_switching) return <FlashOnIcon />;
    if (switchingPattern.is_hyperfocus) return <FocusIcon />;
    return <CheckCircleIcon />;
  };

  const getSwitchingPatternText = () => {
    if (!switchingPattern) return 'Analyzing patterns...';
    
    if (switchingPattern.is_rapid_switching) {
      return 'Rapid Context Switching Detected';
    }
    if (switchingPattern.is_hyperfocus) {
      return 'Hyperfocus Pattern Detected';
    }
    return 'Stable Context Pattern';
  };

  const getSwitchingDescription = () => {
    if (!switchingPattern) return 'Building context switching profile from routing decisions.';
    
    if (switchingPattern.is_rapid_switching) {
      return 'You\'ve switched between multiple project contexts rapidly. Simplified routing and faster models recommended.';
    }
    if (switchingPattern.is_hyperfocus) {
      return 'Deep focus on current project detected. Enhanced context memory and complex reasoning models enabled.';
    }
    return 'Consistent context usage. Standard routing optimization applied.';
  };

  const renderSwitchingPatternCard = () => {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Badge 
              badgeContent={switchingPattern?.recent_contexts?.length || 0} 
              color="primary"
            >
              <PsychologyIcon color="primary" sx={{ mr: 1 }} />
            </Badge>
            <Typography variant="h6">Context Switching Pattern</Typography>
            <Tooltip title="ADHD-aware analysis of project context switching behavior">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Alert 
            severity={getSwitchingPatternColor()} 
            icon={getSwitchingPatternIcon()} 
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">
              {getSwitchingPatternText()}
            </Typography>
            <Typography variant="body2">
              {getSwitchingDescription()}
            </Typography>
          </Alert>

          {switchingPattern && (
            <Box>
              <Grid container spacing={2} mb={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Switch Frequency
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(switchingPattern.switch_frequency * 200, 100)} 
                    color={switchingPattern.switch_frequency > 0.5 ? 'error' : 'primary'}
                    sx={{ mt: 0.5 }}
                  />
                  <Typography variant="caption">
                    {(switchingPattern.switch_frequency * 100).toFixed(1)}% per decision
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Pattern Confidence
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={switchingPattern.pattern_confidence * 100} 
                    sx={{ mt: 0.5 }}
                  />
                  <Typography variant="caption">
                    {Math.round(switchingPattern.pattern_confidence * 100)}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAccommodationsCard = () => {
    const accommodations = [
      {
        key: 'simplified_routing',
        label: 'Simplified Routing',
        description: 'Prefer faster, local models during rapid context switching',
        active: accommodationStatus.simplified_routing,
        icon: <SpeedIcon />,
        recommended: switchingPattern?.is_rapid_switching
      },
      {
        key: 'enhanced_context_memory',
        label: 'Enhanced Context Memory',
        description: 'Remember project context longer during hyperfocus sessions',
        active: accommodationStatus.enhanced_context_memory,
        icon: <VisibilityIcon />,
        recommended: switchingPattern?.is_hyperfocus
      },
      {
        key: 'capacity_aware',
        label: 'Capacity-Aware Routing',
        description: 'Adjust model complexity based on cognitive capacity indicators',
        active: accommodationStatus.capacity_aware,
        icon: <TrendingUpIcon />,
        recommended: true
      }
    ];

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">ADHD Accommodations</Typography>
          </Box>

          <List>
            {accommodations.map((accommodation) => (
              <ListItem key={accommodation.key} divider>
                <ListItemIcon>
                  {accommodation.recommended ? (
                    <Badge badgeContent="!" color="secondary">
                      {accommodation.icon}
                    </Badge>
                  ) : accommodation.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="subtitle2" sx={{ mr: 1 }}>
                        {accommodation.label}
                      </Typography>
                      {accommodation.recommended && (
                        <Chip label="Recommended" size="small" color="secondary" />
                      )}
                    </Box>
                  }
                  secondary={accommodation.description}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={accommodation.active}
                      onChange={(e) => onAccommodationChange(accommodation.key, e.target.checked)}
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  };

  const renderCapacityTrendChart = () => {
    if (!capacityTrend.length) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center" p={3}>
          No capacity data available yet
        </Typography>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={capacityTrend}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis domain={[0, 1]} />
          <Area 
            type="monotone" 
            dataKey="capacity" 
            stroke="#1976d2" 
            fill="url(#capacityGradient)" 
            strokeWidth={2}
            name="Cognitive Capacity"
          />
          <Line 
            type="monotone" 
            dataKey="switching" 
            stroke="#ff7300" 
            strokeWidth={2}
            name="Context Switching"
          />
          <defs>
            <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderRecentContextsList = () => {
    if (!recentContexts.length) {
      return (
        <Typography variant="body2" color="textSecondary" p={2}>
          No recent context data available
        </Typography>
      );
    }

    return (
      <Box>
        {recentContexts.slice(0, 5).map((context, index) => (
          <Box key={index} display="flex" alignItems="center" justifyContent="space-between" p={1}>
            <Typography variant="body2">
              {context.context.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Typography>
            <Box display="flex" alignItems="center">
              <Typography variant="caption" color="textSecondary" sx={{ mr: 1 }}>
                {context.count} uses
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={context.percentage} 
                sx={{ width: 60, mr: 1 }}
              />
              <Typography variant="caption" color="textSecondary">
                {Math.round(context.percentage)}%
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  if (!memoryInsights?.available) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <WarningIcon color="disabled" sx={{ mr: 1 }} />
            <Typography variant="h6" color="textSecondary">
              Context Switching Analysis
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Memory system not available. Enable memory integration to track ADHD-aware context switching patterns.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <PsychologyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5">Context Switching Analysis</Typography>
        <Tooltip title="ADHD-aware analysis of context switching patterns and cognitive accommodations">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Switching Pattern Detection */}
        <Grid item xs={12} md={6}>
          {renderSwitchingPatternCard()}
        </Grid>

        {/* ADHD Accommodations */}
        <Grid item xs={12} md={6}>
          {renderAccommodationsCard()}
        </Grid>

        {/* Capacity Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Cognitive Capacity Trend</Typography>
              </Box>
              {renderCapacityTrendChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Contexts */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" mb={2}>Recent Context Usage</Typography>
              {renderRecentContextsList()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ContextSwitchingAnalysis;

// #endregion end: Context Switching Analysis
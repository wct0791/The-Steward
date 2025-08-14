// Real-Time Routing Intelligence Panel
// Live feed of routing decisions with confidence scores and cognitive analysis

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Button
} from '@mui/material';
import {
  Psychology as BrainIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AutoAwesome as UncensoredIcon,
  TrendingUp as TrendIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

const RealTimeIntelligencePanel = () => {
  const [routingFeed, setRoutingFeed] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [showConfidenceBars, setShowConfidenceBars] = useState(true);
  const [filterUncensored, setFilterUncensored] = useState(false);
  const [summary, setSummary] = useState({
    avgConfidence: 0,
    uncensoredRatio: 0,
    avgResponseTime: 0,
    totalDecisions: 0
  });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isLive) {
      loadRealTimeFeed();
      intervalRef.current = setInterval(loadRealTimeFeed, 3000); // Poll every 3 seconds
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLive, filterUncensored]);

  const loadRealTimeFeed = async () => {
    try {
      setLoading(true);
      const data = await ApiService.request('GET', '/api/analytics/real-time-feed', {
        limit: 20,
        filter_uncensored: filterUncensored
      });
      
      setRoutingFeed(data.decisions || []);
      setSummary(data.summary || summary);
    } catch (error) {
      console.error('Error loading real-time feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModelIcon = (modelName) => {
    if (modelName.includes('dolphin')) return <UncensoredIcon sx={{ color: '#9c27b0' }} />;
    if (modelName.includes('gpt')) return <BrainIcon sx={{ color: '#00a67e' }} />;
    if (modelName.includes('claude')) return <BrainIcon sx={{ color: '#ff6b35' }} />;
    if (modelName.includes('smol')) return <SpeedIcon sx={{ color: '#2196f3' }} />;
    return <BrainIcon sx={{ color: '#757575' }} />;
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'primary';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  const getTaskTypeColor = (taskType) => {
    const colorMap = {
      'uncensored_tasks': '#9c27b0',
      'debug': '#f44336',
      'write': '#4caf50',
      'research': '#ff9800',
      'analyze': '#2196f3',
      'code': '#9c27b0',
      'sensitive': '#795548'
    };
    return colorMap[taskType] || '#757575';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const clearFeed = () => {
    setRoutingFeed([]);
  };

  return (
    <Box>
      {/* Header with Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            🧠 Real-Time Routing Intelligence
            <Badge 
              badgeContent={routingFeed.length} 
              color={isLive ? 'success' : 'default'}
              max={99}
            />
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live feed of intelligent routing decisions and confidence scores
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControlLabel
            control={
              <Switch
                checked={showConfidenceBars}
                onChange={(e) => setShowConfidenceBars(e.target.checked)}
                size="small"
              />
            }
            label="Show Confidence"
          />
          <FormControlLabel
            control={
              <Switch
                checked={filterUncensored}
                onChange={(e) => setFilterUncensored(e.target.checked)}
                size="small"
              />
            }
            label="Uncensored Only"
          />
          <Button
            size="small"
            startIcon={isLive ? <PauseIcon /> : <PlayIcon />}
            onClick={() => setIsLive(!isLive)}
            variant={isLive ? 'contained' : 'outlined'}
            color={isLive ? 'success' : 'primary'}
          >
            {isLive ? 'Live' : 'Paused'}
          </Button>
          <IconButton size="small" onClick={clearFeed}>
            <ClearIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                    {Math.round(summary.avgConfidence * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Confidence
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 600 }}>
                    {Math.round(summary.uncensoredRatio * 100)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Uncensored
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                    {summary.avgResponseTime > 1000 
                      ? `${(summary.avgResponseTime / 1000).toFixed(1)}s`
                      : `${Math.round(summary.avgResponseTime)}ms`
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Response
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={6} md={3}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                    {summary.totalDecisions}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Decisions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Live Decision Feed */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📡 Live Decision Stream
                {loading && <LinearProgress sx={{ mt: 1 }} />}
              </Typography>
              
              {routingFeed.length === 0 ? (
                <Alert severity="info">
                  {isLive ? 'Waiting for new routing decisions...' : 'No routing decisions in feed. Start live mode to see new decisions.'}
                </Alert>
              ) : (
                <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                  {routingFeed.map((decision, index) => (
                    <ListItem key={decision.id || index} divider sx={{ alignItems: 'flex-start' }}>
                      <ListItemAvatar>
                        <Avatar>
                          {getModelIcon(decision.chosen_model)}
                        </Avatar>
                      </ListItemAvatar>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {decision.chosen_model}
                            </Typography>
                            <Chip
                              label={decision.task_type}
                              size="small"
                              sx={{ 
                                backgroundColor: getTaskTypeColor(decision.task_type),
                                color: 'white',
                                fontSize: '0.7rem'
                              }}
                            />
                            {decision.uncensored && (
                              <Chip
                                label="Uncensored"
                                size="small"
                                color="secondary"
                                icon={<UncensoredIcon />}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {formatTimeAgo(decision.timestamp)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {decision.routing_reason}
                            </Typography>
                            
                            {decision.prompt_snippet && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontStyle: 'italic', 
                                  color: 'text.secondary',
                                  bgcolor: 'grey.50',
                                  p: 1,
                                  borderRadius: 1,
                                  mb: 1
                                }}
                              >
                                "{decision.prompt_snippet.substring(0, 80)}..."
                              </Typography>
                            )}
                            
                            {showConfidenceBars && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption">
                                  Confidence: {Math.round(decision.confidence_score * 100)}%
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={decision.confidence_score * 100}
                                  color={getConfidenceColor(decision.confidence_score)}
                                  sx={{ flexGrow: 1, height: 4 }}
                                />
                              </Box>
                            )}
                            
                            {decision.response_time_ms && (
                              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Chip
                                  label={`${decision.response_time_ms > 1000 
                                    ? `${(decision.response_time_ms / 1000).toFixed(1)}s`
                                    : `${Math.round(decision.response_time_ms)}ms`
                                  }`}
                                  size="small"
                                  variant="outlined"
                                  color={decision.response_time_ms < 2000 ? 'success' : 'warning'}
                                />
                                {decision.success && (
                                  <Chip
                                    label="Success"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                  />
                                )}
                                {decision.fallback_triggered && (
                                  <Chip
                                    label="Fallback"
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RealTimeIntelligencePanel;
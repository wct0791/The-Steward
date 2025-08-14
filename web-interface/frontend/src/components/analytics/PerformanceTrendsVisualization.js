// Performance Trends Visualization Component
// Multi-day routing accuracy trends and optimization insights

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
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
  ComposedChart,
  Bar,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import { ApiService } from '../../services/api';

const PerformanceTrendsVisualization = () => {
  const [trendsData, setTrendsData] = useState([]);
  const [modelComparison, setModelComparison] = useState([]);
  const [selectedModels, setSelectedModels] = useState([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [viewMode, setViewMode] = useState('trends'); // trends, comparison, optimization
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true);
  const [loading, setLoading] = useState(false);
  const [optimizationInsights, setOptimizationInsights] = useState([]);

  useEffect(() => {
    loadPerformanceTrends();
  }, [timeframe, selectedModels]);

  const loadPerformanceTrends = async () => {
    try {
      setLoading(true);
      
      const [trends, comparison] = await Promise.all([
        ApiService.request('GET', `/api/analytics/performance-trends?timeframe=${timeframe}`),
        ApiService.request('GET', `/api/analytics/model-comparison?timeframe=${timeframe}`, {
          models: selectedModels
        })
      ]);
      
      setTrendsData(trends.trends || []);
      setModelComparison(comparison.models || []);
      setOptimizationInsights(trends.optimization_insights || []);
      
    } catch (error) {
      console.error('Error loading performance trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend) => {
    if (trend > 0.05) return <TrendUpIcon color="success" />;
    if (trend < -0.05) return <TrendDownIcon color="error" />;
    return <TrendFlatIcon color="action" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0.05) return '#4caf50';
    if (trend < -0.05) return '#f44336';
    return '#757575';
  };

  const formatMetricValue = (metric, value) => {
    switch (metric) {
      case 'accuracy':
      case 'satisfaction':
      case 'confidence':
        return `${(value * 100).toFixed(1)}%`;
      case 'response_time':
        return value > 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
      case 'tokens_per_second':
        return `${value.toFixed(1)} tok/s`;
      default:
        return value.toFixed(2);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box>
      {/* Header with Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" gutterBottom>
            📈 Performance Trends & Optimization
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Multi-day routing accuracy trends and cognitive optimization insights
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <MenuItem value="24h">24 Hours</MenuItem>
              <MenuItem value="7d">7 Days</MenuItem>
              <MenuItem value="30d">30 Days</MenuItem>
              <MenuItem value="90d">90 Days</MenuItem>
            </Select>
          </FormControl>
          
          <ButtonGroup size="small">
            <Button 
              variant={viewMode === 'trends' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('trends')}
            >
              Trends
            </Button>
            <Button 
              variant={viewMode === 'comparison' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('comparison')}
            >
              Compare
            </Button>
            <Button 
              variant={viewMode === 'optimization' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('optimization')}
            >
              Insights
            </Button>
          </ButtonGroup>
          
          <IconButton onClick={loadPerformanceTrends} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {viewMode === 'trends' && (
        <Grid container spacing={3}>
          {/* Key Performance Indicators */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              {[
                { label: 'Routing Accuracy', value: 0.87, trend: 0.08, icon: <PsychologyIcon /> },
                { label: 'User Satisfaction', value: 0.92, trend: 0.03, icon: <StarIcon /> },
                { label: 'Avg Response Time', value: 2340, trend: -0.12, icon: <SpeedIcon />, unit: 'ms' },
                { label: 'ADHD Effectiveness', value: 0.89, trend: 0.15, icon: <AutoAwesomeIcon /> }
              ].map((kpi, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                        {kpi.icon}
                        {getTrendIcon(kpi.trend)}
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 600, color: getTrendColor(kpi.trend) }}>
                        {kpi.unit === 'ms' 
                          ? `${kpi.value > 1000 ? (kpi.value/1000).toFixed(1) + 's' : Math.round(kpi.value) + 'ms'}`
                          : `${(kpi.value * 100).toFixed(0)}%`
                        }
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {kpi.label}
                      </Typography>
                      <Chip
                        label={`${kpi.trend > 0 ? '+' : ''}${(kpi.trend * 100).toFixed(1)}%`}
                        size="small"
                        color={kpi.trend > 0.05 ? 'success' : kpi.trend < -0.05 ? 'error' : 'default'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Routing Accuracy Over Time */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    🎯 Routing Accuracy Trends
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showConfidenceInterval}
                        onChange={(e) => setShowConfidenceInterval(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Confidence Band"
                  />
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis 
                      yAxisId="left"
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(value) => `${value > 1000 ? (value/1000).toFixed(1) + 's' : Math.round(value) + 'ms'}`}
                    />
                    <RechartsTooltip 
                      labelFormatter={formatDateTime}
                      formatter={(value, name) => [
                        formatMetricValue(name, value),
                        name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      ]}
                    />
                    <Legend />
                    
                    {showConfidenceInterval && (
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="accuracy_upper"
                        stackId={1}
                        stroke="none"
                        fill="#1976d2"
                        fillOpacity={0.1}
                      />
                    )}
                    
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="routing_accuracy"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                      name="Routing Accuracy"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="user_satisfaction"
                      stroke="#4caf50"
                      strokeWidth={2}
                      dot={{ fill: '#4caf50', strokeWidth: 2, r: 3 }}
                      name="User Satisfaction"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="avg_response_time"
                      fill="#ff9800"
                      fillOpacity={0.6}
                      name="Avg Response Time"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* ADHD Cognitive Load Analysis */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🧠 Cognitive Load Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis 
                      domain={[1, 5]}
                    />
                    <RechartsTooltip 
                      labelFormatter={formatDateTime}
                      formatter={(value, name) => [
                        `${value.toFixed(1)}/5`,
                        name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="cognitive_load"
                      stackId="1"
                      stroke="#9c27b0"
                      fill="#9c27b0"
                      fillOpacity={0.6}
                      name="Cognitive Load"
                    />
                    <Area
                      type="monotone"
                      dataKey="context_switches"
                      stackId="2"
                      stroke="#ff5722"
                      fill="#ff5722"
                      fillOpacity={0.4}
                      name="Context Switches"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Model Usage Heatmap */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔥 Model Performance Heatmap
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <ScatterChart data={modelComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="avg_response_time" 
                      name="Response Time (ms)"
                      tickFormatter={(value) => value > 1000 ? `${(value/1000).toFixed(1)}s` : `${Math.round(value)}ms`}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="user_satisfaction" 
                      name="Satisfaction Score"
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <RechartsTooltip 
                      formatter={(value, name, props) => [
                        name === 'user_satisfaction' 
                          ? `${(value * 100).toFixed(1)}%`
                          : value > 1000 ? `${(value/1000).toFixed(1)}s` : `${Math.round(value)}ms`,
                        name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                      ]}
                      labelFormatter={(value) => `Model: ${value}`}
                    />
                    <Scatter
                      dataKey="user_satisfaction"
                      fill="#1976d2"
                      name="Model Performance"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {viewMode === 'optimization' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚀 Optimization Insights & Recommendations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  AI-driven insights for improving routing efficiency and user satisfaction
                </Typography>

                {optimizationInsights.length > 0 ? (
                  optimizationInsights.map((insight, index) => (
                    <Alert 
                      key={index}
                      severity={insight.priority === 'high' ? 'error' : insight.priority === 'medium' ? 'warning' : 'info'}
                      sx={{ mb: 2 }}
                      action={
                        insight.actionable && (
                          <Button color="inherit" size="small">
                            Apply
                          </Button>
                        )
                      }
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {insight.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {insight.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={`${insight.impact_estimate}% improvement`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          label={`${insight.confidence}% confidence`}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                        {insight.affected_models && (
                          <Chip
                            label={`Affects: ${insight.affected_models.join(', ')}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    Keep using The Steward to generate optimization insights. 
                    Recommendations will appear here based on your usage patterns.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PerformanceTrendsVisualization;
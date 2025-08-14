import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  LinearProgress,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Psychology,
  Timeline,
  Refresh,
  Info
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { ApiService } from '../services/api';

function PerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [timeframe, setTimeframe] = useState('24h');
  const [performanceData, setPerformanceData] = useState(null);
  const [routingTrends, setRoutingTrends] = useState([]);
  const [modelPerformance, setModelPerformance] = useState([]);
  const [cognitivePatterns, setCognitivePatterns] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadPerformanceMetrics();
  }, [timeframe]);

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true);
      
      // Load all analytics data
      const [metrics, routing, cognitive] = await Promise.all([
        ApiService.getPerformanceMetrics(timeframe),
        ApiService.getRoutingTrends(timeframe),
        ApiService.getCognitivePatterns(timeframe)
      ]);
      
      setPerformanceData(metrics);
      setRoutingTrends(routing);
      setCognitivePatterns(cognitive);
      setModelPerformance(processModelPerformance(metrics));
      setLastRefresh(new Date());
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processModelPerformance = (metrics) => {
    if (!metrics?.model_performance) return [];
    
    return Object.entries(metrics.model_performance).map(([model, data]) => ({
      model,
      performance_score: (data.avg_rating || 0) * 20, // Convert 1-5 to 0-100 scale
      response_time: data.avg_response_time || 0,
      success_rate: (data.success_rate || 0) * 100,
      usage_count: data.request_count || 0,
      trend: data.trend || 'stable'
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading performance analytics...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <IconButton color="inherit" size="small" onClick={loadPerformanceMetrics}>
          <Refresh />
        </IconButton>
      }>
        Failed to load performance metrics: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Performance Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor smart routing performance and cognitive insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['1h', '24h', '7d', '30d'].map((tf) => (
            <Chip
              key={tf}
              label={tf}
              variant={timeframe === tf ? 'filled' : 'outlined'}
              color={timeframe === tf ? 'primary' : 'default'}
              onClick={() => handleTimeframeChange(tf)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
          <IconButton onClick={loadPerformanceMetrics} size="small">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Speed color="primary" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {performanceData?.summary?.avg_response_time 
                    ? formatDuration(performanceData.summary.avg_response_time)
                    : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <TrendingUp color="success" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {performanceData?.summary?.success_rate 
                    ? `${(performanceData.summary.success_rate * 100).toFixed(1)}%`
                    : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Psychology color="secondary" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {performanceData?.summary?.routing_confidence 
                    ? `${(performanceData.summary.routing_confidence * 100).toFixed(0)}%`
                    : '--'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Routing Confidence
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Timeline color="info" sx={{ mr: 2, fontSize: 40 }} />
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {performanceData?.summary?.total_requests || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different analytics views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
        >
          <Tab label="Routing Trends" icon={<TrendingUp />} />
          <Tab label="Model Performance" icon={<Speed />} />
          <Tab label="Cognitive Patterns" icon={<Psychology />} />
          <Tab label="Learning Insights" icon={<Timeline />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Routing Confidence Over Time */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  Routing Confidence Trends
                  <Tooltip title="Shows how confident the smart routing system has been over time">
                    <Info sx={{ ml: 1, fontSize: 16 }} color="action" />
                  </Tooltip>
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={routingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={formatTime}
                    />
                    <YAxis 
                      domain={[0, 1]}
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    />
                    <RechartsTooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Confidence']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Task Type Distribution */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Task Type Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData?.task_distribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(performanceData?.task_distribution || []).map((entry, index) => {
                        const colors = ['#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          {/* Model Performance Comparison */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Model Performance Comparison
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={modelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value, name) => {
                        if (name === 'performance_score') return [`${value.toFixed(1)}%`, 'Performance Score'];
                        if (name === 'response_time') return [formatDuration(value), 'Response Time'];
                        if (name === 'success_rate') return [`${value.toFixed(1)}%`, 'Success Rate'];
                        return [value, name];
                      }}
                    />
                    <Bar dataKey="performance_score" fill="#1976d2" name="Performance Score" />
                    <Bar dataKey="success_rate" fill="#4caf50" name="Success Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Model Usage vs Performance Scatter */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usage vs Performance
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={modelPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="usage_count" 
                      name="Usage Count"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="performance_score" 
                      name="Performance Score"
                      domain={[0, 100]}
                    />
                    <RechartsTooltip 
                      formatter={(value, name) => [
                        name === 'performance_score' ? `${value.toFixed(1)}%` : value,
                        name === 'performance_score' ? 'Performance' : 'Usage'
                      ]}
                      labelFormatter={(value) => `Model: ${value}`}
                    />
                    <Scatter dataKey="performance_score" fill="#1976d2" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Response Time Trends */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Response Time by Model
                </Typography>
                <Box>
                  {modelPerformance.map((model, index) => (
                    <Box key={model.model} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{model.model}</Typography>
                        <Typography variant="body2">{formatDuration(model.response_time)}</Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={Math.min((model.response_time / 5000) * 100, 100)}
                        color={model.response_time < 2000 ? 'success' : model.response_time < 4000 ? 'warning' : 'error'}
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Cognitive Load Patterns */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cognitive Load Patterns
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cognitivePatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="hour" 
                      tickFormatter={(hour) => `${hour}:00`}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(hour) => `${hour}:00`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cognitive_load" 
                      stroke="#9c27b0" 
                      strokeWidth={2}
                      name="Cognitive Load"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="task_complexity" 
                      stroke="#ff9800" 
                      strokeWidth={2}
                      name="Task Complexity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* ADHD Accommodations */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  ADHD Accommodations Effectiveness
                </Typography>
                <Box>
                  {performanceData?.adhd_accommodations?.map((accommodation, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{accommodation.type}</Typography>
                        <Typography variant="body2" color="success.main">
                          {(accommodation.effectiveness * 100).toFixed(0)}% effective
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={accommodation.effectiveness * 100}
                        color="success"
                      />
                      <Typography variant="caption" color="text.secondary">
                        Used {accommodation.usage_count} times
                      </Typography>
                    </Box>
                  )) || (
                    <Typography variant="body2" color="text.secondary">
                      No ADHD accommodation data available yet
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Context Switching Tolerance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Context Switching Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Monitoring your 3-4 task tolerance pattern and productivity impact
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData?.context_switching || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="task_count" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="productivity_score" fill="#673ab7" name="Productivity Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Learning Insights & Recommendations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  AI-discovered patterns and suggestions for improving your workflow
                </Typography>
                
                {performanceData?.learning_insights?.length > 0 ? (
                  performanceData.learning_insights.map((insight, index) => (
                    <Alert 
                      key={index}
                      severity={insight.confidence > 0.8 ? 'success' : insight.confidence > 0.5 ? 'info' : 'warning'}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {insight.pattern_description}
                      </Typography>
                      <Typography variant="body2">
                        {insight.recommendation}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {(insight.confidence * 100).toFixed(0)}% | 
                        Based on {insight.sample_size} data points
                      </Typography>
                    </Alert>
                  ))
                ) : (
                  <Alert severity="info">
                    No learning insights available yet. Keep using The Steward to generate 
                    personalized recommendations based on your usage patterns.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Footer with last refresh time */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {lastRefresh.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );
}

export default PerformanceDashboard;
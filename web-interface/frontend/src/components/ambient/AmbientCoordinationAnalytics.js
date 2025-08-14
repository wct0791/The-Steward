// #region start: Ambient Coordination Analytics for The Steward
// Advanced analytics dashboard for ambient intelligence performance across apps
// Tracks workflow coordination success, context propagation patterns, and optimization metrics

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Grid,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  Insights as InsightsIcon,
  Assessment as AssessmentIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

/**
 * AmbientCoordinationAnalytics - Comprehensive analytics for ambient intelligence
 * 
 * Features:
 * - Workflow coordination success rates and performance trends
 * - Context propagation effectiveness across apps
 * - Conflict resolution analytics and patterns
 * - Cross-app dependency mapping and optimization insights
 * - Cognitive load optimization effectiveness
 * - Predictive insights for workflow improvement
 */
const AmbientCoordinationAnalytics = ({
  analyticsData = null,
  timeRange = '7d',
  onTimeRangeChange = () => {},
  onExportData = () => {},
  ambientOrchestrator = null
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('coordination_success');
  const [viewMode, setViewMode] = useState('trends');

  // Mock analytics data if not provided
  const mockAnalyticsData = {
    coordination_metrics: {
      total_workflows_coordinated: 145,
      success_rate: 0.94,
      average_coordination_time: 2.3, // seconds
      cross_app_dependencies: 89,
      context_propagations: 234,
      conflicts_resolved: 12
    },
    performance_trends: [
      { date: '2024-01-08', success_rate: 0.92, avg_time: 2.8, workflows: 18 },
      { date: '2024-01-09', success_rate: 0.89, avg_time: 3.1, workflows: 22 },
      { date: '2024-01-10', success_rate: 0.95, avg_time: 2.5, workflows: 20 },
      { date: '2024-01-11', success_rate: 0.91, avg_time: 2.9, workflows: 19 },
      { date: '2024-01-12', success_rate: 0.97, avg_time: 2.1, workflows: 25 },
      { date: '2024-01-13', success_rate: 0.94, avg_time: 2.3, workflows: 21 },
      { date: '2024-01-14', success_rate: 0.96, avg_time: 2.0, workflows: 24 }
    ],
    app_coordination_breakdown: [
      { apps: 'Notion + Things', workflows: 65, success_rate: 0.96, avg_time: 1.8 },
      { apps: 'All Three Apps', workflows: 42, success_rate: 0.91, avg_time: 3.2 },
      { apps: 'Things + Notes', workflows: 28, success_rate: 0.95, avg_time: 2.1 },
      { apps: 'Notion + Notes', workflows: 15, success_rate: 0.93, avg_time: 2.4 }
    ],
    context_propagation: [
      { source: 'notion', target: 'things', count: 89, success: 85, avg_time: 1.2 },
      { source: 'notion', target: 'apple_notes', count: 67, success: 63, avg_time: 1.8 },
      { source: 'things', target: 'apple_notes', count: 45, success: 43, avg_time: 1.5 },
      { source: 'things', target: 'notion', count: 23, success: 22, avg_time: 2.1 },
      { source: 'apple_notes', target: 'notion', count: 18, success: 17, avg_time: 2.3 }
    ],
    conflict_analysis: {
      by_type: [
        { type: 'timestamp_conflict', count: 8, resolution_time: 0.5 },
        { type: 'project_context_mismatch', count: 3, resolution_time: 1.2 },
        { type: 'priority_conflict', count: 1, resolution_time: 0.8 }
      ],
      resolution_methods: [
        { method: 'timestamp_wins', count: 7, success_rate: 0.95 },
        { method: 'source_priority', count: 4, success_rate: 0.90 },
        { method: 'manual_resolution', count: 1, success_rate: 1.0 }
      ]
    },
    cognitive_optimization: {
      workflows_optimized: 78,
      average_load_reduction: 0.23,
      hyperfocus_alignment_success: 0.87,
      break_recommendations_followed: 0.71
    },
    predictive_insights: [
      {
        insight: "Notion → Things workflows show 15% higher success when project context is detected within 2 seconds",
        confidence: 0.92,
        impact: 'high'
      },
      {
        insight: "Cross-app conflicts most common during 2-4 PM, suggesting cognitive load impact",
        confidence: 0.84,
        impact: 'medium'
      },
      {
        insight: "Apple Notes research compilations improve Notion documentation quality by 28%",
        confidence: 0.78,
        impact: 'medium'
      }
    ]
  };

  const currentData = analyticsData || mockAnalyticsData;

  const COLORS = ['#1976d2', '#dc004e', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4'];

  const renderOverviewMetrics = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TrendingUpIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h3" color="primary">
              {Math.round(currentData.coordination_metrics.success_rate * 100)}%
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Coordination Success Rate
            </Typography>
            <Typography variant="caption" color="success.main">
              +3% vs last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <SpeedIcon color="secondary" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h3" color="secondary">
              {currentData.coordination_metrics.average_coordination_time}s
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Avg Coordination Time
            </Typography>
            <Typography variant="caption" color="success.main">
              -0.5s vs last week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <TimelineIcon color="info" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h3" color="info.main">
              {currentData.coordination_metrics.total_workflows_coordinated}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total Workflows
            </Typography>
            <Typography variant="caption" color="success.main">
              +12 this week
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card elevation={2}>
          <CardContent sx={{ textAlign: 'center' }}>
            <PsychologyIcon color="warning" sx={{ fontSize: 48, mb: 1 }} />
            <Typography variant="h3" color="warning.main">
              {currentData.cognitive_optimization.workflows_optimized}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Cognitively Optimized
            </Typography>
            <Typography variant="caption" color="success.main">
              {Math.round(currentData.cognitive_optimization.average_load_reduction * 100)}% load reduction
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderPerformanceTrends = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">Performance Trends</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <MenuItem value="coordination_success">Success Rate</MenuItem>
              <MenuItem value="coordination_time">Avg Time</MenuItem>
              <MenuItem value="workflow_count">Workflow Count</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={currentData.performance_trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            {selectedMetric === 'coordination_success' && (
              <Line
                type="monotone"
                dataKey="success_rate"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
              />
            )}
            {selectedMetric === 'coordination_time' && (
              <Line
                type="monotone"
                dataKey="avg_time"
                stroke="#dc004e"
                strokeWidth={2}
                dot={{ fill: '#dc004e', strokeWidth: 2, r: 4 }}
              />
            )}
            {selectedMetric === 'workflow_count' && (
              <Line
                type="monotone"
                dataKey="workflows"
                stroke="#9c27b0"
                strokeWidth={2}
                dot={{ fill: '#9c27b0', strokeWidth: 2, r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderAppCoordination = () => (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" mb={2}>App Coordination Breakdown</Typography>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={currentData.app_coordination_breakdown}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="apps" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Bar dataKey="workflows" fill="#1976d2" name="Workflows" />
            <Bar dataKey="success_rate" fill="#4caf50" name="Success Rate" />
          </BarChart>
        </ResponsiveContainer>

        <Box mt={2}>
          <Typography variant="subtitle2" mb={1}>Insights</Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <InsightsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Notion + Things combination shows highest success rate"
                secondary="96% success across 65 workflows - optimal for task-oriented workflows"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <AssessmentIcon color="secondary" />
              </ListItemIcon>
              <ListItemText
                primary="All three apps coordination takes longer but remains effective"
                secondary="3.2s avg coordination time for comprehensive cross-app workflows"
              />
            </ListItem>
          </List>
        </Box>
      </CardContent>
    </Card>
  );

  const renderContextPropagation = () => {
    const propagationData = currentData.context_propagation.map(item => ({
      name: `${item.source} → ${item.target}`,
      value: item.count,
      success_rate: (item.success / item.count * 100).toFixed(1)
    }));

    return (
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" mb={2}>Context Propagation Patterns</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={propagationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {propagationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <List>
                {currentData.context_propagation.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {item.source} → {item.target}
                          </Typography>
                          <Chip
                            label={`${Math.round(item.success/item.count * 100)}%`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={`${item.success}/${item.count} successful, ${item.avg_time}s avg`}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderConflictAnalysis = () => (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" mb={2}>Conflict Analysis</Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" mb={2}>Conflicts by Type</Typography>
            <List>
              {currentData.conflict_analysis.by_type.map((conflict, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={conflict.type.replace('_', ' ').toUpperCase()}
                    secondary={`${conflict.count} occurrences, ${conflict.resolution_time}s avg resolution`}
                  />
                  <Chip
                    label={conflict.count}
                    color={conflict.count > 5 ? 'warning' : 'default'}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" mb={2}>Resolution Methods</Typography>
            <List>
              {currentData.conflict_analysis.resolution_methods.map((method, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={method.method.replace('_', ' ').toUpperCase()}
                    secondary={`${method.count} uses, ${Math.round(method.success_rate * 100)}% success`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>

        {currentData.conflict_analysis.by_type.length === 0 && (
          <Alert severity="success">
            <Typography variant="body2">
              No significant conflict patterns detected. Your ambient intelligence is running smoothly!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderPredictiveInsights = () => (
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <InsightsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Predictive Insights</Typography>
        </Box>

        <List>
          {currentData.predictive_insights.map((insight, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 
                      insight.impact === 'high' ? 'error.main' :
                      insight.impact === 'medium' ? 'warning.main' : 'success.main'
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={insight.insight}
                secondary={
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Chip
                      label={`${Math.round(insight.confidence * 100)}% confidence`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${insight.impact} impact`}
                      size="small"
                      color={
                        insight.impact === 'high' ? 'error' :
                        insight.impact === 'medium' ? 'warning' : 'success'
                      }
                    />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );

  const tabContent = [
    { label: 'Overview', content: renderOverviewMetrics() },
    { label: 'Performance', content: renderPerformanceTrends() },
    { label: 'App Coordination', content: renderAppCoordination() },
    { label: 'Context Flow', content: renderContextPropagation() },
    { label: 'Conflicts', content: renderConflictAnalysis() },
    { label: 'Insights', content: renderPredictiveInsights() }
  ];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Ambient Coordination Analytics</Typography>
          <Tooltip title="Deep insights into your ambient intelligence performance and optimization opportunities">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => onTimeRangeChange(e.target.value)}
            >
              <MenuItem value="24h">Last 24h</MenuItem>
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>

          <Button
            startIcon={<DownloadIcon />}
            variant="outlined"
            size="small"
            onClick={onExportData}
          >
            Export
          </Button>
        </Box>
      </Box>

      <Card elevation={1} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabContent.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Card>

      <Box>
        {tabContent[activeTab]?.content}
      </Box>
    </Box>
  );
};

export default AmbientCoordinationAnalytics;

// #endregion end: Ambient Coordination Analytics
// #region start: System Status Overview Component
// Comprehensive system health and status monitoring interface
// Provides real-time insights into The Steward's operational state

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  HealthAndSafety as HealthIcon,
  Speed as SpeedIcon,
  Psychology as PsychologyIcon,
  Hub as HubIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

/**
 * SystemStatusOverview - System health and status monitoring
 * 
 * Features:
 * - Real-time system health monitoring
 * - Component status tracking
 * - Performance metrics visualization
 * - Configuration status overview
 * - Integration health monitoring
 */
const SystemStatusOverview = ({ systemStatus, onRefresh, apiBase }) => {
  // State management
  const [expandedSections, setExpandedSections] = useState({
    health: true,
    configuration: false,
    integrations: false,
    performance: false
  });
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle section expansion toggle
   */
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /**
   * Handle refresh with loading state
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  /**
   * Get status color based on health status
   */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'configured':
      case 'optimal':
        return 'success';
      case 'degraded':
      case 'inactive':
      case 'missing':
      case 'warning':
        return 'warning';
      case 'error':
      case 'failed':
      case 'unavailable':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'active':
      case 'configured':
      case 'optimal':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
      case 'inactive':
      case 'missing':
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'failed':
      case 'unavailable':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  /**
   * Calculate overall health score
   */
  const calculateHealthScore = () => {
    if (!systemStatus?.system_health) return 0;

    const components = Object.values(systemStatus.system_health);
    const healthyComponents = components.filter(comp => 
      comp?.status === 'healthy' || comp?.status === 'active'
    ).length;

    return components.length > 0 ? (healthyComponents / components.length) * 100 : 0;
  };

  /**
   * Render system health overview
   */
  const renderHealthOverview = () => {
    if (!systemStatus?.system_health) return null;

    const healthScore = calculateHealthScore();
    const components = systemStatus.system_health;

    return (
      <Card>
        <CardHeader
          title="System Health"
          action={
            <Box>
              <Tooltip title="Refresh status">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => toggleSection('health')}>
                {expandedSections.health ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          }
          avatar={<HealthIcon color="primary" />}
        />
        <CardContent>
          <Box mb={3}>
            <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
              <Typography variant="body2">Overall Health Score</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.round(healthScore)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={healthScore}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: healthScore >= 80 ? 'success.main' : 
                                  healthScore >= 60 ? 'warning.main' : 'error.main'
                }
              }}
            />
          </Box>

          <Collapse in={expandedSections.health}>
            <List dense>
              {Object.entries(components).map(([key, component]) => (
                <ListItem key={key}>
                  <ListItemIcon>
                    {getStatusIcon(component?.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    secondary={
                      <Box>
                        <Chip
                          label={component?.status || 'Unknown'}
                          size="small"
                          color={getStatusColor(component?.status)}
                          sx={{ mr: 1 }}
                        />
                        {component?.capabilities && (
                          <Typography variant="caption" color="textSecondary">
                            {component.capabilities.length} capabilities available
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render configuration status
   */
  const renderConfigurationStatus = () => {
    if (!systemStatus?.configuration) return null;

    const config = systemStatus.configuration;

    return (
      <Card>
        <CardHeader
          title="Configuration Status"
          action={
            <IconButton onClick={() => toggleSection('configuration')}>
              {expandedSections.configuration ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={<SettingsIcon color="secondary" />}
        />
        <CardContent>
          <Collapse in={expandedSections.configuration}>
            {Object.entries(config).map(([key, configItem]) => (
              <Box key={key} mb={2}>
                <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Chip
                    label={configItem?.status || 'Unknown'}
                    size="small"
                    color={getStatusColor(configItem?.status)}
                  />
                </Box>
                
                {configItem?.completeness_score !== undefined && (
                  <Box>
                    <Box display="flex" justifyContent="between" alignItems="center" mb={0.5}>
                      <Typography variant="caption" color="textSecondary">
                        Completeness
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {Math.round(configItem.completeness_score)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={configItem.completeness_score}
                      sx={{ height: 4, borderRadius: 2 }}
                    />
                  </Box>
                )}

                {configItem?.configured_sections && (
                  <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                    Configured: {configItem.configured_sections.join(', ')}
                  </Typography>
                )}

                {configItem?.recommendations && configItem.recommendations.length > 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      {configItem.recommendations[0]}
                    </Typography>
                  </Alert>
                )}
              </Box>
            ))}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render integration status
   */
  const renderIntegrationStatus = () => {
    if (!systemStatus?.integrations) return null;

    const integrations = systemStatus.integrations;

    return (
      <Card>
        <CardHeader
          title="Integration Status"
          action={
            <IconButton onClick={() => toggleSection('integrations')}>
              {expandedSections.integrations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={<HubIcon color="info" />}
        />
        <CardContent>
          <Collapse in={expandedSections.integrations}>
            {Object.entries(integrations).map(([key, integration]) => (
              <Box key={key} mb={2}>
                <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">
                    {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                  <Box>
                    {getStatusIcon(integration?.status)}
                    <Chip
                      label={integration?.status || 'Unknown'}
                      size="small"
                      color={getStatusColor(integration?.status)}
                      sx={{ ml: 1 }}
                    />
                  </Box>
                </Box>

                {integration?.integrations && (
                  <Box>
                    <Typography variant="caption" color="textSecondary" display="block" mb={1}>
                      Connected Apps:
                    </Typography>
                    {Object.entries(integration.integrations).map(([appKey, appStatus]) => (
                      <Chip
                        key={appKey}
                        label={`${appKey}: ${appStatus?.initialized ? 'Connected' : 'Not Connected'}`}
                        size="small"
                        color={appStatus?.initialized ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                )}

                {integration?.issues && integration.issues.length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography variant="caption">
                      Issues: {integration.issues.join(', ')}
                    </Typography>
                  </Alert>
                )}
              </Box>
            ))}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render performance metrics
   */
  const renderPerformanceMetrics = () => {
    if (!systemStatus?.performance) return null;

    const performance = systemStatus.performance;

    return (
      <Card>
        <CardHeader
          title="Performance Metrics"
          action={
            <IconButton onClick={() => toggleSection('performance')}>
              {expandedSections.performance ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={<SpeedIcon color="success" />}
        />
        <CardContent>
          <Collapse in={expandedSections.performance}>
            <Grid container spacing={2}>
              {Object.entries(performance).map(([key, value]) => (
                <Grid item xs={6} md={3} key={key}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {typeof value === 'number' ? 
                        (key.includes('score') ? `${value}%` : value) : 
                        value}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Performance trends or additional insights could go here */}
            {performance.efficiency_score < 80 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Performance can be improved. Consider optimizing routing preferences or checking system resources.
                </Typography>
              </Alert>
            )}
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render recommendations
   */
  const renderRecommendations = () => {
    if (!systemStatus?.recommendations || systemStatus.recommendations.length === 0) {
      return null;
    }

    return (
      <Card>
        <CardHeader
          title="System Recommendations"
          avatar={<AnalyticsIcon color="warning" />}
        />
        <CardContent>
          {systemStatus.recommendations.map((recommendation, index) => (
            <Alert 
              key={index}
              severity={recommendation.priority === 'high' ? 'warning' : 'info'}
              sx={{ mb: index < systemStatus.recommendations.length - 1 ? 2 : 0 }}
              action={
                recommendation.action && (
                  <Button size="small" variant="outlined">
                    {recommendation.action}
                  </Button>
                )
              }
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {recommendation.title}
              </Typography>
              <Typography variant="body2">
                {recommendation.description}
              </Typography>
              {recommendation.benefit && (
                <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                  Benefit: {recommendation.benefit}
                </Typography>
              )}
            </Alert>
          ))}
        </CardContent>
      </Card>
    );
  };

  if (!systemStatus) {
    return (
      <Alert severity="info">
        <Typography>System status information is not available.</Typography>
        <Button onClick={handleRefresh} sx={{ mt: 1 }}>
          Try Refreshing
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      {/* Last Update Info */}
      <Box mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Typography variant="body2" color="textSecondary">
          Last updated: {systemStatus.last_introspection ? 
            new Date(systemStatus.last_introspection).toLocaleString() : 
            'Never'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* System Health */}
        <Grid item xs={12}>
          {renderHealthOverview()}
        </Grid>

        {/* Configuration Status */}
        <Grid item xs={12} lg={6}>
          {renderConfigurationStatus()}
        </Grid>

        {/* Integration Status */}
        <Grid item xs={12} lg={6}>
          {renderIntegrationStatus()}
        </Grid>

        {/* Performance Metrics */}
        <Grid item xs={12}>
          {renderPerformanceMetrics()}
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12}>
          {renderRecommendations()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemStatusOverview;

// #endregion end: System Status Overview Component
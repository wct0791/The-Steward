// #region start: Help Center Component for The Steward Dashboard
// Main help interface component integrating all self-documentation features
// Provides natural language help, feature discovery, and system guidance

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Alert,
  IconButton,
  Collapse,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Help as HelpIcon,
  Search as SearchIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoFixHigh as AutoFixHighIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';

// Import help sub-components
import InteractiveQueryInterface from './InteractiveQueryInterface';
import FeatureDiscoveryPanel from './FeatureDiscoveryPanel';
import SystemStatusOverview from './SystemStatusOverview';
import CapabilityExplorer from './CapabilityExplorer';

/**
 * HelpCenter - Main help and self-documentation interface
 * 
 * Provides integrated access to:
 * 1. Natural language help queries
 * 2. Feature discovery and suggestions
 * 3. System status and health monitoring
 * 4. Capability exploration and explanations
 * 5. Quick-start guidance and onboarding
 */
const HelpCenter = ({ userLevel = 'intermediate', onClose }) => {
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickStartData, setQuickStartData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    quickActions: true,
    recommendations: false
  });

  // API base URL (adjust based on your backend configuration)
  const API_BASE = '/api/help';

  /**
   * Fetch system status and quick-start data on component mount
   */
  useEffect(() => {
    const initializeHelpCenter = async () => {
      try {
        setLoading(true);
        
        // Fetch system status
        const statusResponse = await fetch(`${API_BASE}/system-status`);
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
          setSystemStatus(statusData);
        }

        // Fetch quick-start guidance
        const quickStartResponse = await fetch(
          `${API_BASE}/quick-start?userLevel=${userLevel}&existingSetup=true`
        );
        const quickStartData = await quickStartResponse.json();
        
        if (quickStartData.success) {
          setQuickStartData(quickStartData);
        }

      } catch (error) {
        console.error('Error initializing help center:', error);
        setError('Failed to load help system data');
      } finally {
        setLoading(false);
      }
    };

    initializeHelpCenter();
  }, [userLevel, API_BASE]);

  /**
   * Handle tab change
   */
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionName) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  /**
   * Render quick actions based on system status
   */
  const renderQuickActions = () => {
    if (!systemStatus || !quickStartData) return null;

    const actions = [];

    // Character sheet setup
    if (systemStatus.configuration?.character_sheet?.completeness_score < 75) {
      actions.push({
        title: 'Complete Character Sheet',
        description: 'Finish personalizing your AI experience',
        icon: <PsychologyIcon color="primary" />,
        action: 'character-sheet-setup',
        priority: 'high'
      });
    }

    // Ambient intelligence setup
    if (systemStatus.integrations?.ambient?.status !== 'active') {
      actions.push({
        title: 'Enable Ambient Intelligence',
        description: 'Set up cross-app workflow coordination',
        icon: <AutoFixHighIcon color="secondary" />,
        action: 'ambient-setup',
        priority: 'medium'
      });
    }

    // Performance optimization
    if (systemStatus.performance?.efficiency_score < 80) {
      actions.push({
        title: 'Optimize Performance',
        description: 'Improve routing and response speed',
        icon: <SpeedIcon color="warning" />,
        action: 'performance-optimization',
        priority: 'low'
      });
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Quick Actions"
          action={
            <IconButton onClick={() => toggleSection('quickActions')}>
              {expandedSections.quickActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={<LightbulbIcon color="primary" />}
        />
        <Collapse in={expandedSections.quickActions}>
          <CardContent>
            <Grid container spacing={2}>
              {actions.map((action, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      borderColor: action.priority === 'high' ? 'primary.main' : 'grey.300'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box display="flex" alignItems="center" mb={1}>
                        {action.icon}
                        <Chip 
                          label={action.priority} 
                          size="small" 
                          color={action.priority === 'high' ? 'primary' : action.priority === 'medium' ? 'secondary' : 'default'}
                          sx={{ ml: 'auto' }}
                        />
                      </Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {action.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  /**
   * Render system recommendations
   */
  const renderRecommendations = () => {
    if (!systemStatus?.recommendations || systemStatus.recommendations.length === 0) {
      return null;
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="System Recommendations"
          action={
            <IconButton onClick={() => toggleSection('recommendations')}>
              {expandedSections.recommendations ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={<TrendingUpIcon color="secondary" />}
        />
        <Collapse in={expandedSections.recommendations}>
          <CardContent>
            {systemStatus.recommendations.slice(0, 3).map((recommendation, index) => (
              <Alert 
                key={index} 
                severity={recommendation.priority === 'high' ? 'warning' : 'info'}
                sx={{ mb: 2 }}
                action={
                  <Button size="small" variant="outlined">
                    Learn More
                  </Button>
                }
              >
                <Typography variant="subtitle2" fontWeight="bold">
                  {recommendation.title}
                </Typography>
                <Typography variant="body2">
                  {recommendation.description}
                </Typography>
              </Alert>
            ))}
          </CardContent>
        </Collapse>
      </Card>
    );
  };

  /**
   * Main render
   */
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Help Center...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6">Help System Error</Typography>
        <Typography>{error}</Typography>
        <Button onClick={() => window.location.reload()} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="between" mb={4}>
        <Box display="flex" alignItems="center">
          <HelpIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              The Steward Help Center
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Intelligent assistance and self-documentation system
            </Typography>
          </Box>
        </Box>
        {onClose && (
          <Button variant="outlined" onClick={onClose}>
            Close
          </Button>
        )}
      </Box>

      {/* Quick Actions and Recommendations */}
      {renderQuickActions()}
      {renderRecommendations()}

      {/* Main Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label="Ask Questions" 
            icon={<SearchIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Discover Features" 
            icon={<LightbulbIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="System Status" 
            icon={<SettingsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Explore Capabilities" 
            icon={<PsychologyIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && (
          <InteractiveQueryInterface 
            userLevel={userLevel}
            systemStatus={systemStatus}
            apiBase={API_BASE}
          />
        )}
        
        {activeTab === 1 && (
          <FeatureDiscoveryPanel
            userLevel={userLevel}
            systemStatus={systemStatus}
            quickStartData={quickStartData}
            apiBase={API_BASE}
          />
        )}
        
        {activeTab === 2 && (
          <SystemStatusOverview
            systemStatus={systemStatus}
            onRefresh={() => window.location.reload()}
            apiBase={API_BASE}
          />
        )}
        
        {activeTab === 3 && (
          <CapabilityExplorer
            userLevel={userLevel}
            systemStatus={systemStatus}
            apiBase={API_BASE}
          />
        )}
      </Box>

      {/* Footer */}
      <Box mt={6} pt={3} borderTop={1} borderColor="divider">
        <Typography variant="body2" color="textSecondary" align="center">
          The Steward's self-documentation system provides intelligent assistance based on your usage patterns and system state.
          <br />
          For additional support, visit the documentation or contact the development team.
        </Typography>
      </Box>
    </Container>
  );
};

export default HelpCenter;

// #endregion end: Help Center Component
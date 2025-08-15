// #region start: Capability Explorer Component
// Interactive capability exploration and detailed explanations
// Provides comprehensive understanding of The Steward's features

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Collapse,
  Alert,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Hub as HubIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as AutoAwesomeIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  Integration as IntegrationIcon,
  TrendingUp as TrendingUpIcon,
  Help as HelpIcon
} from '@mui/icons-material';

/**
 * CapabilityExplorer - Interactive capability exploration interface
 * 
 * Features:
 * - Categorized capability browsing
 * - Detailed feature explanations
 * - Search functionality
 * - Progressive disclosure by user level
 * - Interactive exploration paths
 */
const CapabilityExplorer = ({ userLevel, systemStatus, apiBase }) => {
  // State management
  const [activeCategory, setActiveCategory] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCapability, setSelectedCapability] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [breadcrumbs, setBreadcrumbs] = useState(['Capabilities']);

  // Capability categories
  const categories = [
    {
      name: 'Smart Routing',
      key: 'routing',
      icon: <PsychologyIcon />,
      description: 'AI model selection and optimization',
      capabilities: ['smart_routing', 'model_selection', 'performance_optimization', 'cost_optimization']
    },
    {
      name: 'Personalization',
      key: 'personalization',
      icon: <AutoAwesomeIcon />,
      description: 'Character sheet and ADHD accommodations',
      capabilities: ['character_sheet', 'adhd_accommodations', 'cognitive_adaptation', 'preference_learning']
    },
    {
      name: 'Ambient Intelligence',
      key: 'ambient',
      icon: <HubIcon />,
      description: 'Cross-app workflow coordination',
      capabilities: ['workflow_coordination', 'context_synchronization', 'automated_documentation', 'predictive_workflows']
    },
    {
      name: 'Model Interface',
      key: 'models',
      icon: <SettingsIcon />,
      description: 'AI model management and connectivity',
      capabilities: ['multi_model_support', 'automatic_failover', 'performance_monitoring', 'privacy_options']
    }
  ];

  /**
   * Filter capabilities based on search query
   */
  const filteredCapabilities = categories[activeCategory]?.capabilities.filter(cap =>
    cap.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  /**
   * Load detailed explanation for a capability
   */
  const loadCapabilityExplanation = async (capabilityName) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/explain/${capabilityName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userLevel,
          context: {
            systemStatus: systemStatus ? {
              health: systemStatus.system_health,
              capabilities: systemStatus.capabilities
            } : null
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setExplanation(data.explanation);
        setSelectedCapability(capabilityName);
        setBreadcrumbs(['Capabilities', categories[activeCategory].name, capabilityName]);
      } else {
        console.error('Failed to load explanation:', data.error);
      }

    } catch (error) {
      console.error('Error loading capability explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle category change
   */
  const handleCategoryChange = (event, newValue) => {
    setActiveCategory(newValue);
    setSelectedCapability(null);
    setExplanation(null);
    setBreadcrumbs(['Capabilities']);
    setSearchQuery('');
  };

  /**
   * Toggle card expansion
   */
  const toggleCardExpansion = (capability) => {
    setExpandedCards(prev => ({
      ...prev,
      [capability]: !prev[capability]
    }));
  };

  /**
   * Navigate back to capability list
   */
  const navigateBack = () => {
    setSelectedCapability(null);
    setExplanation(null);
    setBreadcrumbs(['Capabilities']);
  };

  /**
   * Get capability display name
   */
  const getCapabilityDisplayName = (capability) => {
    return capability
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get capability icon
   */
  const getCapabilityIcon = (capability) => {
    if (capability.includes('routing') || capability.includes('model')) {
      return <PsychologyIcon color="primary" />;
    } else if (capability.includes('performance') || capability.includes('speed')) {
      return <SpeedIcon color="success" />;
    } else if (capability.includes('security') || capability.includes('privacy')) {
      return <SecurityIcon color="warning" />;
    } else if (capability.includes('integration') || capability.includes('workflow')) {
      return <IntegrationIcon color="secondary" />;
    } else if (capability.includes('optimization') || capability.includes('analytics')) {
      return <TrendingUpIcon color="info" />;
    }
    return <CodeIcon color="default" />;
  };

  /**
   * Render capability card
   */
  const renderCapabilityCard = (capability) => {
    const isExpanded = expandedCards[capability];

    return (
      <Card key={capability} sx={{ mb: 2 }}>
        <CardHeader
          title={getCapabilityDisplayName(capability)}
          avatar={getCapabilityIcon(capability)}
          action={
            <IconButton onClick={() => toggleCardExpansion(capability)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
        />
        
        <Collapse in={isExpanded}>
          <CardContent>
            <Typography variant="body2" color="textSecondary" paragraph>
              Click "Explore" to learn more about this capability and how it works.
            </Typography>
            
            {/* Show basic info based on system status */}
            {systemStatus?.capabilities?.[capability] && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  This capability is currently available in your system.
                </Typography>
              </Alert>
            )}
          </CardContent>
          
          <CardActions>
            <Button
              onClick={() => loadCapabilityExplanation(capability)}
              variant="contained"
              size="small"
              disabled={loading}
            >
              Explore
            </Button>
            <Button
              size="small"
              onClick={() => toggleCardExpansion(capability)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </CardActions>
        </Collapse>
      </Card>
    );
  };

  /**
   * Render detailed explanation
   */
  const renderExplanation = () => {
    if (!explanation || !selectedCapability) return null;

    return (
      <Box>
        {/* Breadcrumb Navigation */}
        <Box mb={3}>
          <Breadcrumbs>
            <Link 
              component="button" 
              variant="body2" 
              onClick={navigateBack}
              sx={{ textDecoration: 'none' }}
            >
              Capabilities
            </Link>
            <Link 
              component="button" 
              variant="body2" 
              onClick={navigateBack}
              sx={{ textDecoration: 'none' }}
            >
              {categories[activeCategory].name}
            </Link>
            <Typography variant="body2" color="textPrimary">
              {getCapabilityDisplayName(selectedCapability)}
            </Typography>
          </Breadcrumbs>
        </Box>

        <Card>
          <CardHeader
            title={explanation.name || getCapabilityDisplayName(selectedCapability)}
            avatar={getCapabilityIcon(selectedCapability)}
            action={
              <Button onClick={navigateBack} variant="outlined" size="small">
                Back
              </Button>
            }
          />
          
          <CardContent>
            <Typography variant="body1" paragraph>
              {explanation.description}
            </Typography>

            {/* Key Features */}
            {explanation.key_features && explanation.key_features.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="primary">
                  Key Features
                </Typography>
                <List dense>
                  {explanation.key_features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Chip label={index + 1} size="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Benefits */}
            {explanation.how_it_helps && explanation.how_it_helps.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="secondary">
                  How It Helps You
                </Typography>
                <List dense>
                  {explanation.how_it_helps.map((benefit, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <AutoAwesomeIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={benefit} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Examples (for beginner/intermediate users) */}
            {explanation.examples && explanation.examples.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="info">
                  Examples
                </Typography>
                <List dense>
                  {explanation.examples.map((example, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CodeIcon color="info" />
                      </ListItemIcon>
                      <ListItemText primary={example} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Advanced Features (for advanced users) */}
            {explanation.advanced_features && explanation.advanced_features.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom color="warning">
                  Advanced Features
                </Typography>
                <List dense>
                  {explanation.advanced_features.map((feature, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <SettingsIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {/* Why This Matters (for beginners) */}
            {explanation.why_this_matters && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Why This Matters
                </Typography>
                <Typography variant="body2">
                  {explanation.why_this_matters}
                </Typography>
              </Alert>
            )}

            {/* Related Capabilities */}
            {explanation.related_capabilities && explanation.related_capabilities.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Related Capabilities
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {explanation.related_capabilities.map((related, index) => (
                    <Chip
                      key={index}
                      label={getCapabilityDisplayName(related)}
                      clickable
                      onClick={() => loadCapabilityExplanation(related)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  };

  /**
   * Render capability browser
   */
  const renderCapabilityBrowser = () => {
    return (
      <Box>
        {/* Search */}
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={`Search ${categories[activeCategory].name.toLowerCase()} capabilities...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Category Description */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>{categories[activeCategory].name}:</strong> {categories[activeCategory].description}
          </Typography>
        </Alert>

        {/* Capabilities List */}
        {filteredCapabilities.length === 0 ? (
          <Alert severity="warning">
            <Typography variant="body2">
              No capabilities found matching your search.
            </Typography>
          </Alert>
        ) : (
          <Box>
            {filteredCapabilities.map((capability) => renderCapabilityCard(capability))}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {selectedCapability && explanation ? (
        renderExplanation()
      ) : (
        <>
          {/* Category Tabs */}
          <Box mb={3}>
            <Tabs
              value={activeCategory}
              onChange={handleCategoryChange}
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              {categories.map((category, index) => (
                <Tab
                  key={index}
                  label={category.name}
                  icon={category.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>

          {renderCapabilityBrowser()}
        </>
      )}

      {/* Help Text */}
      <Box mt={4} p={2} bgcolor="grey.50" borderRadius={1}>
        <Box display="flex" alignItems="center" mb={1}>
          <HelpIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle2">
            Understanding The Steward's Capabilities
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          Explore each capability to understand how The Steward can help you. 
          The explanations are tailored to your experience level ({userLevel}) 
          and current system configuration.
        </Typography>
      </Box>
    </Box>
  );
};

export default CapabilityExplorer;

// #endregion end: Capability Explorer Component
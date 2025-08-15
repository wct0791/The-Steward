// #region start: Feature Discovery Panel Component
// Intelligent feature suggestion and progressive disclosure interface
// Provides personalized feature recommendations based on usage patterns

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
  LinearProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Collapse,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AutoAwesome as AutoAwesomeIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PlayArrow as PlayArrowIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

/**
 * FeatureDiscoveryPanel - Intelligent feature suggestion system
 * 
 * Features:
 * - Context-aware feature recommendations
 * - Progressive onboarding paths
 * - User expertise tracking
 * - Personalized learning opportunities
 * - Usage-based suggestions
 */
const FeatureDiscoveryPanel = ({ userLevel, systemStatus, quickStartData, apiBase }) => {
  // State management
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onboardingPath, setOnboardingPath] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedCards, setExpandedCards] = useState({});
  const [userExpertise, setUserExpertise] = useState(null);

  /**
   * Initialize feature discovery on component mount
   */
  useEffect(() => {
    loadFeatureSuggestions();
  }, [userLevel, systemStatus]);

  /**
   * Load feature suggestions from the API
   */
  const loadFeatureSuggestions = async () => {
    try {
      setLoading(true);

      // Prepare interaction data based on system status
      const interactionData = {
        taskType: 'feature_discovery',
        indicators: generateIndicators(),
        featuresUsed: getCurrentlyUsedFeatures()
      };

      // Prepare user context
      const userContext = {
        userLevel,
        isNewUser: userLevel === 'beginner',
        systemConfiguration: systemStatus?.configuration || {}
      };

      const response = await fetch(`${apiBase}/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interactionData,
          userContext,
          requestType: 'dashboard_discovery'
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuggestions(data.feature_suggestions || []);
        setUserExpertise(data.user_expertise);
        
        // Set onboarding path if available
        if (data.onboarding_path && data.onboarding_path.length > 0) {
          setOnboardingPath(data.onboarding_path);
        }
      } else {
        console.error('Failed to load feature suggestions:', data.error);
      }

    } catch (error) {
      console.error('Error loading feature suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate indicators based on system status
   */
  const generateIndicators = () => {
    const indicators = [];

    if (!systemStatus) return indicators;

    // Configuration-based indicators
    if (systemStatus.configuration?.character_sheet?.completeness_score < 50) {
      indicators.push('incomplete_personalization');
    }

    // Integration-based indicators
    if (systemStatus.integrations?.ambient?.status !== 'active') {
      indicators.push('workflow_inefficiency');
    }

    // Performance-based indicators
    if (systemStatus.performance?.efficiency_score < 80) {
      indicators.push('performance_optimization_needed');
    }

    return indicators;
  };

  /**
   * Get currently used features based on system status
   */
  const getCurrentlyUsedFeatures = () => {
    const features = [];

    if (!systemStatus) return features;

    if (systemStatus.system_health?.smart_routing?.status === 'healthy') {
      features.push('smart_routing');
    }

    if (systemStatus.configuration?.character_sheet?.status === 'configured') {
      features.push('character_sheet');
    }

    if (systemStatus.integrations?.ambient?.status === 'active') {
      features.push('ambient_intelligence');
    }

    return features;
  };

  /**
   * Toggle card expansion
   */
  const toggleCardExpansion = (featureKey) => {
    setExpandedCards(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };

  /**
   * Handle feature setup action
   */
  const handleSetupFeature = (feature) => {
    // In a real implementation, this would navigate to the appropriate setup flow
    console.log('Starting setup for feature:', feature.feature_key);
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 10:
      case 9:
      case 8:
        return 'error';
      case 7:
      case 6:
        return 'warning';
      case 5:
      case 4:
        return 'primary';
      default:
        return 'default';
    }
  };

  /**
   * Get difficulty color
   */
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'automatic':
        return 'success';
      case 'easy':
        return 'primary';
      case 'medium':
        return 'warning';
      case 'complex':
      case 'expert':
        return 'error';
      default:
        return 'default';
    }
  };

  /**
   * Render onboarding path
   */
  const renderOnboardingPath = () => {
    if (!onboardingPath || onboardingPath.length === 0) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Your Learning Path"
          subheader="Recommended steps to get the most out of The Steward"
          avatar={<SchoolIcon color="primary" />}
        />
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {onboardingPath.map((step, index) => (
              <Step key={index}>
                <StepLabel>
                  <Typography variant="subtitle1">
                    {step.title}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {step.description}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={step.estimated_time}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => {
                        setActiveStep(index + 1);
                        // Handle feature setup
                        if (step.feature) {
                          handleSetupFeature({ feature_key: step.feature });
                        }
                      }}
                      sx={{ mr: 1 }}
                    >
                      {index === onboardingPath.length - 1 ? 'Complete' : 'Continue'}
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setActiveStep(index + 1)}
                    >
                      Skip
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>
    );
  };

  /**
   * Render user expertise overview
   */
  const renderExpertiseOverview = () => {
    if (!userExpertise) return null;

    const totalFeatures = Object.keys(userExpertise.feature_expertise || {}).length;
    const expertFeatures = userExpertise.strengths?.length || 0;
    const progressPercentage = totalFeatures > 0 ? (expertFeatures / totalFeatures) * 100 : 0;

    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Your Expertise Level"
          subheader={`Overall Level: ${userExpertise.overall_level}`}
          avatar={<PsychologyIcon color="secondary" />}
        />
        <CardContent>
          <Box mb={2}>
            <Typography variant="body2" gutterBottom>
              Feature Mastery Progress
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progressPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="textSecondary">
              {expertFeatures} of {totalFeatures} features mastered
            </Typography>
          </Box>

          {userExpertise.strengths && userExpertise.strengths.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Your Strengths:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {userExpertise.strengths.map((strength, index) => (
                  <Chip
                    key={index}
                    label={strength.replace('_', ' ')}
                    size="small"
                    color="primary"
                    icon={<CheckCircleIcon />}
                  />
                ))}
              </Box>
            </Box>
          )}

          {userExpertise.growth_areas && userExpertise.growth_areas.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Growth Opportunities:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {userExpertise.growth_areas.slice(0, 4).map((area, index) => (
                  <Chip
                    key={index}
                    label={area.replace('_', ' ')}
                    size="small"
                    variant="outlined"
                    color="secondary"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  /**
   * Render feature suggestion card
   */
  const renderFeatureCard = (feature) => {
    const isExpanded = expandedCards[feature.feature_key];

    return (
      <Card key={feature.feature_key} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title={
            <Box display="flex" alignItems="center" gap={1}>
              {feature.feature_name}
              <Badge
                badgeContent={feature.priority}
                color={getPriorityColor(feature.priority)}
                variant="dot"
              />
            </Box>
          }
          subheader={feature.reason_type?.replace('_', ' ') || 'Recommended'}
          action={
            <IconButton onClick={() => toggleCardExpansion(feature.feature_key)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          }
          avatar={
            feature.reason_type === 'usage_based' ? <TrendingUpIcon color="primary" /> :
            feature.reason_type === 'context_based' ? <PsychologyIcon color="secondary" /> :
            feature.reason_type === 'problem_based' ? <AutoAwesomeIcon color="warning" /> :
            <LightbulbIcon color="primary" />
          }
        />
        
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="body2" color="textSecondary" paragraph>
            {feature.description}
          </Typography>

          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            <Chip
              label={feature.setup_difficulty}
              size="small"
              color={getDifficultyColor(feature.setup_difficulty)}
              variant="outlined"
            />
            <Chip
              icon={<ScheduleIcon />}
              label={feature.time_to_value}
              size="small"
              variant="outlined"
            />
          </Box>

          <Collapse in={isExpanded}>
            <Box>
              {feature.benefits && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Benefits:
                  </Typography>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {feature.benefits.map((benefit, index) => (
                      <li key={index}>
                        <Typography variant="body2">{benefit}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}

              {feature.explanation && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    How it works:
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {feature.explanation}
                  </Typography>
                </Box>
              )}

              {feature.setup_guidance && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Setup:</strong> {feature.setup_guidance}
                  </Typography>
                </Alert>
              )}
            </Box>
          </Collapse>
        </CardContent>

        <CardActions>
          <Button
            startIcon={<PlayArrowIcon />}
            onClick={() => handleSetupFeature(feature)}
            color="primary"
          >
            Get Started
          </Button>
          <Button
            size="small"
            onClick={() => toggleCardExpansion(feature.feature_key)}
          >
            {isExpanded ? 'Show Less' : 'Learn More'}
          </Button>
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <Typography>Loading personalized suggestions...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Expertise Overview */}
      {renderExpertiseOverview()}

      {/* Onboarding Path */}
      {renderOnboardingPath()}

      {/* Feature Suggestions */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Recommended Features
      </Typography>
      
      {suggestions.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">
            No new feature suggestions at this time. You're doing great with The Steward!
          </Typography>
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {suggestions.map((suggestion) => (
            <Grid item xs={12} md={6} lg={4} key={suggestion.feature_key}>
              {renderFeatureCard(suggestion)}
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          <Button
            variant="outlined"
            startIcon={<LightbulbIcon />}
            onClick={loadFeatureSuggestions}
          >
            Refresh Suggestions
          </Button>
          <Button
            variant="outlined"
            startIcon={<SchoolIcon />}
            onClick={() => setActiveStep(0)}
            disabled={!onboardingPath}
          >
            Restart Learning Path
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default FeatureDiscoveryPanel;

// #endregion end: Feature Discovery Panel Component
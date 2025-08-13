import React, { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Chip,
  Card,
  CardContent,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useTheme
} from '@mui/material';
import {
  Psychology as BrainIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  AccessTime as TimeIcon,
  Assignment as TaskIcon,
  SmartToy as ModelIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

function RoutingVisualization({ routingDecision }) {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState({
    classification: true,
    cognitive: false,
    performance: false,
    privacy: false
  });

  if (!routingDecision) {
    return null;
  }

  const { classification, selection, contexts } = routingDecision;
  const timeContext = contexts?.time_context || {};
  const cognitiveState = contexts?.cognitive_state || {};
  const performanceInsights = contexts?.performance_insights || {};

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getComplexityChip = (complexity) => {
    const colors = {
      low: 'success',
      medium: 'warning', 
      high: 'error'
    };
    
    return (
      <Chip
        size="small"
        label={complexity || 'unknown'}
        color={colors[complexity] || 'default'}
        variant="outlined"
      />
    );
  };

  return (
    <Box>
      {/* Main Routing Decision */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Selected Model */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'primary.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ModelIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Selected Model
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                {selection?.model || 'Unknown'}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                <Chip
                  size="small"
                  label={`${Math.round((selection?.confidence || 0) * 100)}% confidence`}
                  color={getConfidenceColor(selection?.confidence)}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task Classification */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TaskIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Task Type
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                {classification?.type || 'General'}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${Math.round((classification?.confidence || 0) * 100)}%`}
                  color={getConfidenceColor(classification?.confidence)}
                />
                {selection?.complexity_analysis?.level && getComplexityChip(selection.complexity_analysis.level)}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Routing Strategy */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', bgcolor: 'info.50' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SecurityIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Strategy
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                {selection?.routing_strategy?.replace(/_/g, ' ')?.toUpperCase() || 'SMART'}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip
                  size="small"
                  label={selection?.tier || 'tier1-fast'}
                  variant="outlined"
                  color="info"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Routing Reason */}
      {selection?.reason && (
        <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <InfoIcon sx={{ color: 'info.main', mt: 0.5, fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Routing Reasoning
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selection.reason}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Sections */}
      <Grid container spacing={2}>
        {/* Task Classification Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TaskIcon sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Task Analysis
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => toggleSection('classification')}
                >
                  {expandedSections.classification ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.classification}>
                <Box>
                  {/* Task Type */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Task Type
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {classification?.type || 'general'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(classification?.confidence || 0) * 100}
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        color={getConfidenceColor(classification?.confidence)}
                      />
                      <Typography variant="caption">
                        {Math.round((classification?.confidence || 0) * 100)}%
                      </Typography>
                    </Box>
                  </Box>

                  {/* Characteristics */}
                  {classification?.characteristics && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Characteristics
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {classification.characteristics.map((char, index) => (
                          <Chip
                            key={index}
                            size="small"
                            label={char}
                            variant="outlined"
                            color="primary"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Complexity Analysis */}
                  {selection?.complexity_analysis && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Complexity Analysis
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {getComplexityChip(selection.complexity_analysis.level)}
                        <Chip
                          size="small"
                          label={`${Math.round((selection.complexity_analysis.confidence || 0) * 100)}% confident`}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Cognitive State */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BrainIcon sx={{ mr: 1, color: 'purple' }} />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  Cognitive Context
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => toggleSection('cognitive')}
                >
                  {expandedSections.cognitive ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              
              <Collapse in={expandedSections.cognitive}>
                <Box>
                  {/* Time Context */}
                  {timeContext.time_period && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Time Context
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body1">
                          {timeContext.time_period} • {timeContext.energy_level} energy
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Cognitive Capacity */}
                  {cognitiveState.cognitive_capacity && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Cognitive Capacity
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={cognitiveState.cognitive_capacity.level}
                          color={
                            cognitiveState.cognitive_capacity.level === 'high' ? 'success' :
                            cognitiveState.cognitive_capacity.level === 'medium' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          ({cognitiveState.cognitive_capacity.reasoning})
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Task Alignment */}
                  {cognitiveState.task_alignment && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Task Alignment
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={cognitiveState.task_alignment.level}
                          color={
                            cognitiveState.task_alignment.level === 'high' ? 'success' :
                            cognitiveState.task_alignment.level === 'medium' ? 'warning' : 'error'
                          }
                          variant="outlined"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Score: {Math.round((cognitiveState.task_alignment.alignment_score || 0) * 100)}%
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy & Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Grid container spacing={2}>
                {/* Privacy Analysis */}
                {selection?.privacy_analysis && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SecurityIcon sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">
                        Privacy Analysis
                      </Typography>
                    </Box>
                    
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          {selection.privacy_analysis.contains_sensitive ? 
                            <WarningIcon color="warning" /> : 
                            <CheckCircleIcon color="success" />
                          }
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            selection.privacy_analysis.contains_sensitive ? 
                              'Sensitive content detected' : 
                              'No sensitive content'
                          }
                          secondary={`Privacy level: ${selection.privacy_analysis.privacy_level || 'standard'}`}
                        />
                      </ListItem>
                      
                      {selection.privacy_analysis.requires_local && (
                        <ListItem>
                          <ListItemIcon>
                            <SecurityIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary="Local processing recommended"
                            secondary="Enhanced privacy protection"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                )}

                {/* Fallback Options */}
                {selection?.fallbacks && selection.fallbacks.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">
                        Fallback Options
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {selection.fallbacks.slice(0, 3).map((fallback, index) => (
                        <Chip
                          key={index}
                          size="small"
                          label={fallback}
                          variant="outlined"
                          color="warning"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Recommendations */}
      {performanceInsights?.recommendations && performanceInsights.recommendations.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TrendingUpIcon sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                Performance Insights
              </Typography>
            </Box>
            
            <List dense>
              {performanceInsights.recommendations.slice(0, 3).map((rec, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary={rec.message}
                    secondary={`${rec.type} • ${Math.round((rec.confidence || 0) * 100)}% confidence`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

export default RoutingVisualization;
// #region start: Memory-Informed Routing Visualization
// Shows how past decisions influence current routing choices
// Displays confidence scores, pattern matching, and learning evolution

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  LinearProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Memory as MemoryIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

/**
 * MemoryInformedRouting - Visualization of memory-enhanced routing decisions
 * 
 * Features:
 * - Memory influence on routing decisions
 * - Pattern matching confidence over time
 * - Learning evolution visualization
 * - Historical vs current routing comparison
 */
const MemoryInformedRouting = ({ 
  routingDecisions = [], 
  memoryInsights = null,
  onMemorySettingChange = () => {}
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [memoryInfluence, setMemoryInfluence] = useState([]);
  const [patternEvolution, setPatternEvolution] = useState([]);
  const [routingComparison, setRoutingComparison] = useState(null);
  const [learningMetrics, setLearningMetrics] = useState(null);

  useEffect(() => {
    if (routingDecisions.length > 0) {
      processRoutingData();
    }
    if (memoryInsights?.available) {
      processMemoryMetrics();
    }
  }, [routingDecisions, memoryInsights]);

  const processRoutingData = () => {
    // Extract memory-informed routing decisions
    const memoryInformed = routingDecisions
      .filter(decision => decision.memory_integration?.memory_informed)
      .slice(-20);

    // Process memory influence over time
    const influence = memoryInformed.map((decision, index) => {
      const contextAnalysis = decision.memory_integration?.context_analysis;
      return {
        decision_id: index + 1,
        memory_confidence: contextAnalysis?.confidence || 0,
        routing_confidence: decision.selection?.confidence || 0,
        project_context: contextAnalysis?.project_context?.project || 'unknown',
        model_selected: decision.selection?.model || 'unknown',
        timestamp: decision.timestamp
      };
    });

    setMemoryInfluence(influence);

    // Track pattern evolution
    const patterns = [];
    let runningAccuracy = 0;
    
    memoryInformed.forEach((decision, index) => {
      const contextAnalysis = decision.memory_integration?.context_analysis;
      const recommendations = contextAnalysis?.routing_recommendations?.primary_recommendations || [];
      
      // Simulate accuracy based on confidence and recommendations
      const accuracy = recommendations.length > 0 ? 
        (contextAnalysis.confidence + decision.selection.confidence) / 2 : 0.5;
      
      runningAccuracy = (runningAccuracy * index + accuracy) / (index + 1);
      
      patterns.push({
        decision_id: index + 1,
        accuracy: runningAccuracy,
        pattern_strength: contextAnalysis?.confidence || 0,
        recommendations_count: recommendations.length,
        timestamp: decision.timestamp
      });
    });

    setPatternEvolution(patterns);

    // Compare memory vs standard routing
    const memoryDecisions = routingDecisions.filter(d => d.memory_integration?.memory_informed).length;
    const standardDecisions = routingDecisions.filter(d => !d.memory_integration?.memory_informed).length;
    
    setRoutingComparison({
      memory_informed: memoryDecisions,
      standard_routing: standardDecisions,
      memory_percentage: routingDecisions.length > 0 ? 
        (memoryDecisions / routingDecisions.length) * 100 : 0,
      total_decisions: routingDecisions.length
    });
  };

  const processMemoryMetrics = () => {
    const crossSession = memoryInsights.cross_session_learning;
    const contextSwitching = memoryInsights.context_switching;
    
    setLearningMetrics({
      total_decisions: crossSession?.total_decisions || 0,
      total_projects: crossSession?.total_projects || 0,
      learning_maturity: crossSession?.total_decisions > 100 ? 0.9 : 
        (crossSession?.total_decisions || 0) / 100,
      context_stability: contextSwitching?.switching_frequency ? 
        1 - contextSwitching.switching_frequency : 0.7,
      pattern_recognition: memoryInfluence.length > 10 ? 0.8 : 
        memoryInfluence.length / 10
    });
  };

  const renderMemoryInfluenceChart = () => {
    if (!memoryInfluence.length) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center" p={3}>
          No memory-informed routing decisions yet
        </Typography>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={memoryInfluence}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="decision_id" />
          <YAxis domain={[0, 1]} />
          <Line 
            type="monotone" 
            dataKey="memory_confidence" 
            stroke="#1976d2" 
            strokeWidth={2}
            name="Memory Confidence"
            dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="routing_confidence" 
            stroke="#ff7300" 
            strokeWidth={2}
            name="Routing Confidence"
            dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderPatternEvolutionChart = () => {
    if (!patternEvolution.length) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center" p={3}>
          No pattern evolution data available
        </Typography>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart data={patternEvolution}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="decision_id" name="Decision" />
          <YAxis dataKey="accuracy" name="Accuracy" domain={[0, 1]} />
          <Scatter 
            name="Pattern Accuracy" 
            dataKey="accuracy" 
            fill="#8884d8"
          />
          <Line 
            type="monotone" 
            dataKey="pattern_strength" 
            stroke="#82ca9d" 
            strokeWidth={2}
            name="Pattern Strength"
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const renderLearningRadarChart = () => {
    if (!learningMetrics) return null;

    const radarData = [
      { metric: 'Learning Maturity', value: learningMetrics.learning_maturity },
      { metric: 'Context Stability', value: learningMetrics.context_stability },
      { metric: 'Pattern Recognition', value: learningMetrics.pattern_recognition },
      { metric: 'Decision Volume', value: Math.min(learningMetrics.total_decisions / 100, 1) },
      { metric: 'Project Diversity', value: Math.min(learningMetrics.total_projects / 10, 1) }
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={radarData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" />
          <PolarRadiusAxis angle={90} domain={[0, 1]} />
          <Radar
            name="Learning Metrics"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const renderRoutingComparisonCard = () => {
    if (!routingComparison) {
      return (
        <Typography variant="body2" color="textSecondary" p={3}>
          No routing comparison data available
        </Typography>
      );
    }

    return (
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <Box textAlign="center">
            <Typography variant="h3" color="primary">
              {routingComparison.memory_informed}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Memory-Informed Decisions
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={routingComparison.memory_percentage} 
              sx={{ mt: 1 }}
            />
            <Typography variant="caption">
              {Math.round(routingComparison.memory_percentage)}% of total
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box textAlign="center">
            <Typography variant="h3" color="secondary">
              {routingComparison.standard_routing}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Standard Routing Decisions
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={100 - routingComparison.memory_percentage}
              color="secondary"
              sx={{ mt: 1 }}
            />
            <Typography variant="caption">
              {Math.round(100 - routingComparison.memory_percentage)}% of total
            </Typography>
          </Box>
        </Grid>
      </Grid>
    );
  };

  const renderMemoryDecisionsList = () => {
    const memoryDecisions = routingDecisions
      .filter(decision => decision.memory_integration?.memory_informed)
      .slice(-10);

    if (!memoryDecisions.length) {
      return (
        <Typography variant="body2" color="textSecondary" p={3}>
          No memory-informed decisions recorded yet
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Model Selected</TableCell>
              <TableCell align="right">Memory Confidence</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {memoryDecisions.map((decision, index) => {
              const context = decision.memory_integration?.context_analysis;
              return (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="caption">
                      {new Date(decision.timestamp).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={context?.project_context?.project || 'Unknown'} 
                      size="small" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {decision.selection?.model}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" alignItems="center">
                      <LinearProgress 
                        variant="determinate" 
                        value={(context?.confidence || 0) * 100} 
                        sx={{ width: 40, mr: 1 }}
                      />
                      <Typography variant="caption">
                        {Math.round((context?.confidence || 0) * 100)}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={decision.selection?.reason || ''}>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {decision.selection?.reason?.substring(0, 50)}...
                      </Typography>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderMemorySettingsCard = () => {
    const settings = [
      {
        key: 'project_context_awareness',
        label: 'Project Context Awareness',
        description: 'Enable automatic project detection and context-specific routing'
      },
      {
        key: 'routing_history_weight',
        label: 'Historical Pattern Weight',
        description: 'How much past decisions influence current routing (0.3 = 30%)'
      },
      {
        key: 'cross_session_learning',
        label: 'Cross-Session Learning',
        description: 'Learn from routing patterns across different sessions'
      }
    ];

    return (
      <Box>
        {settings.map((setting) => (
          <Box key={setting.key} p={2} borderBottom="1px solid #eee">
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2">{setting.label}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {setting.description}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={true} // Would be connected to actual settings
                    onChange={(e) => onMemorySettingChange(setting.key, e.target.checked)}
                  />
                }
                label=""
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  const tabContent = [
    {
      label: 'Memory Influence',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Memory vs Routing Confidence</Typography>
                {renderMemoryInfluenceChart()}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Memory-Informed Decisions</Typography>
                {renderMemoryDecisionsList()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Pattern Evolution',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Pattern Recognition Evolution</Typography>
                {renderPatternEvolutionChart()}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Learning Metrics</Typography>
                {renderLearningRadarChart()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    },
    {
      label: 'Routing Comparison',
      content: (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Memory vs Standard Routing</Typography>
                {renderRoutingComparisonCard()}
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" mb={2}>Memory System Settings</Typography>
                {renderMemorySettingsCard()}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )
    }
  ];

  if (!memoryInsights?.available) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <WarningIcon color="disabled" sx={{ mr: 1 }} />
            <Typography variant="h6" color="textSecondary">
              Memory-Informed Routing
            </Typography>
          </Box>
          <Alert severity="info">
            <Typography variant="body2">
              Memory system not available. Enable memory integration in character sheet to see memory-informed routing analysis.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <MemoryIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5">Memory-Informed Routing</Typography>
        <Tooltip title="Analysis of how historical patterns influence current routing decisions">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box mb={2}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          {tabContent.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      <Box>
        {tabContent[activeTab]?.content}
      </Box>
    </Box>
  );
};

export default MemoryInformedRouting;

// #endregion end: Memory-Informed Routing Visualization
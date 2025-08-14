// #region start: Project Intelligence Panel for The Steward Analytics
// Real-time project context detection and routing history visualization
// Shows memory-informed routing decisions and cross-session learning

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
  IconButton
} from '@mui/material';
import { 
  Memory as MemoryIcon,
  Psychology as PsychologyIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

/**
 * ProjectIntelligencePanel - Dashboard component for project-aware routing intelligence
 * 
 * Features:
 * - Current project detection display
 * - Routing history for current context
 * - Cross-session learning progress
 * - Memory-informed routing statistics
 */
const ProjectIntelligencePanel = ({ routingData = [], memoryInsights = null }) => {
  const [currentProject, setCurrentProject] = useState(null);
  const [projectHistory, setProjectHistory] = useState([]);
  const [learningProgress, setLearningProgress] = useState(null);

  useEffect(() => {
    if (memoryInsights?.available) {
      processMemoryInsights();
    }
  }, [memoryInsights]);

  const processMemoryInsights = () => {
    if (!memoryInsights.cross_session_learning) return;

    // Set current dominant project
    const dominantProject = memoryInsights.context_switching?.dominant_context;
    if (dominantProject && dominantProject !== 'none') {
      setCurrentProject({
        name: dominantProject,
        confidence: memoryInsights.context_switching?.switching_frequency || 0.5,
        recent_decisions: memoryInsights.context_switching?.total_recent_decisions || 0
      });
    }

    // Process project history
    const projects = memoryInsights.cross_session_learning?.projects || [];
    const historyData = projects.map(project => ({
      project: project.project_context,
      decisions: project.decisions,
      confidence: project.avg_confidence,
      models_used: project.models_used,
      insights: memoryInsights.project_insights?.[project.project_context]
    })).sort((a, b) => b.decisions - a.decisions);

    setProjectHistory(historyData);

    // Calculate learning progress
    const totalDecisions = memoryInsights.cross_session_learning.total_decisions;
    const totalProjects = memoryInsights.cross_session_learning.total_projects;
    
    setLearningProgress({
      total_decisions: totalDecisions,
      total_projects: totalProjects,
      learning_rate: totalDecisions > 100 ? 0.8 : totalDecisions / 100,
      status: memoryInsights.memory_status
    });
  };

  const renderCurrentProjectCard = () => {
    if (!currentProject) {
      return (
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <PsychologyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Current Project Context</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              No active project context detected. Memory system learning from usage patterns.
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <PsychologyIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Current Project Context</Typography>
            <Tooltip title="Detected from recent routing decisions">
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Box display="flex" alignItems="center" mb={2}>
            <Chip 
              label={currentProject.name} 
              color="primary" 
              variant="outlined"
              sx={{ mr: 2 }}
            />
            <Typography variant="body2" color="textSecondary">
              {currentProject.recent_decisions} recent decisions
            </Typography>
          </Box>

          <Box mb={1}>
            <Typography variant="body2" color="textSecondary">
              Context Confidence
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={currentProject.confidence * 100} 
              sx={{ mt: 0.5 }}
            />
            <Typography variant="caption" color="textSecondary">
              {Math.round(currentProject.confidence * 100)}%
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderProjectHistoryChart = () => {
    if (!projectHistory.length) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center" p={3}>
          No project history available yet
        </Typography>
      );
    }

    const chartData = projectHistory.slice(0, 8).map(project => ({
      name: project.project.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      decisions: project.decisions,
      confidence: Math.round(project.confidence * 100),
      models: project.models_used
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Bar dataKey="decisions" fill="#1976d2" name="Routing Decisions" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderModelDistributionChart = () => {
    if (!projectHistory.length) return null;

    // Aggregate model usage across all projects
    const modelUsage = {};
    projectHistory.forEach(project => {
      if (project.insights?.model_usage) {
        project.insights.model_usage.forEach(model => {
          modelUsage[model.selected_model] = (modelUsage[model.selected_model] || 0) + model.usage_count;
        });
      }
    });

    const pieData = Object.entries(modelUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([model, count]) => ({
        name: model,
        value: count
      }));

    if (!pieData.length) return null;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderLearningProgressCard = () => {
    if (!learningProgress) {
      return (
        <Card elevation={2}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Learning Progress</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Memory system initializing...
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Cross-Session Learning</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={6}>
              <Typography variant="h4" color="primary">
                {learningProgress.total_decisions}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Routing Decisions
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="h4" color="secondary">
                {learningProgress.total_projects}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Project Contexts Learned
              </Typography>
            </Grid>
          </Grid>

          <Box mt={2}>
            <Typography variant="body2" color="textSecondary" mb={1}>
              Learning Maturity
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={learningProgress.learning_rate * 100} 
              color="secondary"
            />
            <Typography variant="caption" color="textSecondary">
              {Math.round(learningProgress.learning_rate * 100)}% - {learningProgress.status}
            </Typography>
          </Box>

          <Box mt={2}>
            <Chip 
              label={`Status: ${learningProgress.status}`}
              color="success" 
              size="small"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderProjectInsightsTable = () => {
    if (!projectHistory.length) {
      return (
        <Typography variant="body2" color="textSecondary" textAlign="center" p={3}>
          No project insights available yet
        </Typography>
      );
    }

    return (
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Project</TableCell>
              <TableCell align="right">Decisions</TableCell>
              <TableCell align="right">Avg Confidence</TableCell>
              <TableCell align="right">Top Model</TableCell>
              <TableCell align="right">Models Used</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {projectHistory.slice(0, 10).map((project, index) => (
              <TableRow key={index} hover>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" fontWeight="medium">
                    {project.project.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Typography>
                </TableCell>
                <TableCell align="right">{project.decisions}</TableCell>
                <TableCell align="right">
                  {Math.round(project.confidence * 100)}%
                </TableCell>
                <TableCell align="right">
                  <Chip 
                    label={project.insights?.top_model || 'N/A'} 
                    size="small" 
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">{project.models_used}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (!memoryInsights?.available) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <MemoryIcon color="disabled" sx={{ mr: 1 }} />
            <Typography variant="h6" color="textSecondary">
              Project Intelligence
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary">
            Memory system not available. {memoryInsights?.reason || 'Enable memory integration in character sheet to see project intelligence.'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <MemoryIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h5">Project Intelligence</Typography>
        <Tooltip title="Memory-informed routing based on project context and historical patterns">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {/* Current Project Context */}
        <Grid item xs={12} md={6}>
          {renderCurrentProjectCard()}
        </Grid>

        {/* Learning Progress */}
        <Grid item xs={12} md={6}>
          {renderLearningProgressCard()}
        </Grid>

        {/* Project History Chart */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimelineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Project Routing History</Typography>
              </Box>
              {renderProjectHistoryChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* Model Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" mb={2}>Model Usage Distribution</Typography>
              {renderModelDistributionChart()}
            </CardContent>
          </Card>
        </Grid>

        {/* Project Insights Table */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" mb={2}>Project Insights</Typography>
              {renderProjectInsightsTable()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectIntelligencePanel;

// #endregion end: Project Intelligence Panel
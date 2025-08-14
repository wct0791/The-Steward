// #region start: Predictive Workflow Panel for The Steward
// Display suggested task sequences, cognitive load predictions, and workflow orchestration
// Enables workflow acceptance, modification, and custom template creation

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Tooltip,
  Alert
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Schedule as ScheduleIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Lightbulb as LightbulbIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';

/**
 * PredictiveWorkflowPanel - Interactive workflow prediction and management
 * 
 * Features:
 * - Display AI-generated task sequences with confidence scores
 * - Show cognitive load predictions and optimal timing
 * - Provide workflow acceptance/modification interface
 * - Visualize task dependencies and estimated durations
 * - Enable custom workflow template creation
 */
const PredictiveWorkflowPanel = ({
  workflowSuggestions = [],
  cognitiveLoadPredictions = null,
  onWorkflowAccept = () => {},
  onWorkflowModify = () => {},
  onCreateCustomTemplate = () => {},
  currentProject = null
}) => {
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [modificationDialog, setModificationDialog] = useState(false);
  const [customTemplateDialog, setCustomTemplateDialog] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState({});
  const [cognitiveOptimization, setCognitiveOptimization] = useState(true);

  useEffect(() => {
    // Set default selected workflow
    if (workflowSuggestions.length > 0 && !selectedWorkflow) {
      setSelectedWorkflow(workflowSuggestions[0]);
    }
  }, [workflowSuggestions]);

  const renderWorkflowCard = (workflow, index) => {
    const isSelected = selectedWorkflow?.workflow_id === workflow.workflow_id;
    
    return (
      <Card
        key={workflow.workflow_id}
        elevation={isSelected ? 4 : 2}
        sx={{
          mb: 2,
          border: isSelected ? '2px solid #1976d2' : 'none',
          cursor: 'pointer'
        }}
        onClick={() => setSelectedWorkflow(workflow)}
      >
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center">
              <TimelineIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {workflow.name || `${workflow.project_context} Workflow`}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${Math.round(workflow.completion_probability * 100)}% success`}
                color={workflow.completion_probability > 0.8 ? 'success' : 'warning'}
                size="small"
              />
              <Chip
                label={`${workflow.total_estimated_duration} min`}
                variant="outlined"
                size="small"
              />
            </Box>
          </Box>

          {/* Workflow Steps Preview */}
          <Box mb={2}>
            <Typography variant="subtitle2" color="textSecondary" mb={1}>
              Workflow Steps ({workflow.steps?.length || 0})
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {(workflow.steps || []).slice(0, 4).map((step, stepIndex) => (
                <Chip
                  key={stepIndex}
                  label={step.phase || step.task_type}
                  size="small"
                  color={step.cognitive_load === 'high' ? 'error' : 
                         step.cognitive_load === 'medium' ? 'warning' : 'default'}
                  variant="outlined"
                />
              ))}
              {workflow.steps?.length > 4 && (
                <Chip label={`+${workflow.steps.length - 4} more`} size="small" variant="outlined" />
              )}
            </Box>
          </Box>

          {/* Cognitive Load Distribution */}
          {workflow.cognitive_load_distribution && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="textSecondary" mb={1}>
                Cognitive Load Distribution
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={workflow.cognitive_load_distribution.high_load_percentage}
                    color="error"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="error">
                    High: {Math.round(workflow.cognitive_load_distribution.high_load_percentage)}%
                  </Typography>
                </Box>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={workflow.cognitive_load_distribution.medium_load_percentage}
                    color="warning"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="warning.main">
                    Medium: {Math.round(workflow.cognitive_load_distribution.medium_load_percentage)}%
                  </Typography>
                </Box>
                <Box flex={1}>
                  <LinearProgress
                    variant="determinate"
                    value={workflow.cognitive_load_distribution.low_load_percentage}
                    color="success"
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="success.main">
                    Low: {Math.round(workflow.cognitive_load_distribution.low_load_percentage)}%
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={1} justifyContent="flex-end">
            <Button
              startIcon={<EditIcon />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setModificationDialog(true);
              }}
            >
              Modify
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayIcon />}
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onWorkflowAccept(workflow);
              }}
            >
              Accept & Start
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedWorkflowView = () => {
    if (!selectedWorkflow) {
      return (
        <Card elevation={2}>
          <CardContent>
            <Typography variant="h6" color="textSecondary" textAlign="center" py={4}>
              Select a workflow to view details
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={3}>
            <Box display="flex" alignItems="center">
              <TimelineIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                {selectedWorkflow.name || `${selectedWorkflow.project_context} Workflow`}
              </Typography>
            </Box>
            <Tooltip title="Workflow uses AI predictions for optimal task sequencing">
              <IconButton size="small">
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Workflow Statistics */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {selectedWorkflow.steps?.length || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Steps
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {selectedWorkflow.total_estimated_duration}m
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Duration
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  {Math.round(selectedWorkflow.completion_probability * 100)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">
                  {selectedWorkflow.cognitive_load_distribution?.cognitive_balance || 'Balanced'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Load Balance
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Workflow Steps Stepper */}
          <Box mb={3}>
            <Typography variant="h6" mb={2}>Predicted Task Sequence</Typography>
            <Stepper orientation="vertical">
              {(selectedWorkflow.steps || []).map((step, index) => (
                <Step key={index} active={true}>
                  <StepLabel>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="subtitle1">
                        {step.phase || step.task_type}
                      </Typography>
                      <Chip
                        label={step.cognitive_load}
                        size="small"
                        color={step.cognitive_load === 'high' ? 'error' : 
                               step.cognitive_load === 'medium' ? 'warning' : 'success'}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {step.estimated_duration}min
                      </Typography>
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Box pl={2}>
                      <Typography variant="body2" color="textSecondary" mb={1}>
                        Confidence: {Math.round(step.confidence * 100)}%
                      </Typography>
                      
                      {step.dependencies && step.dependencies.length > 0 && (
                        <Box mb={1}>
                          <Typography variant="caption" color="textSecondary">
                            Depends on: {step.dependencies.join(', ')}
                          </Typography>
                        </Box>
                      )}

                      {step.optimal_timing && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="caption">
                            Optimal: {Array.isArray(step.optimal_timing) ? 
                              step.optimal_timing.join(', ') : step.optimal_timing}
                          </Typography>
                        </Box>
                      )}

                      {step.parallel_possible && (
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <SpeedIcon fontSize="small" color="success" />
                          <Typography variant="caption" color="success.main">
                            Can run in parallel
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>

          {/* Cognitive Load Timeline */}
          {renderCognitiveLoadChart()}
        </CardContent>
      </Card>
    );
  };

  const renderCognitiveLoadChart = () => {
    if (!selectedWorkflow.steps) return null;

    const chartData = selectedWorkflow.steps.map((step, index) => ({
      step: step.phase || step.task_type,
      cognitive_load: step.cognitive_load === 'high' ? 3 : step.cognitive_load === 'medium' ? 2 : 1,
      duration: step.estimated_duration,
      confidence: step.confidence
    }));

    return (
      <Box>
        <Typography variant="h6" mb={2}>Cognitive Load Timeline</Typography>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="step" angle={-45} textAnchor="end" height={60} />
            <YAxis domain={[0, 3]} />
            <Bar dataKey="cognitive_load" fill="#1976d2" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    );
  };

  const renderModificationDialog = () => {
    const [modifiedWorkflow, setModifiedWorkflow] = useState(selectedWorkflow);

    return (
      <Dialog
        open={modificationDialog}
        onClose={() => setModificationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Modify Workflow</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Workflow Name"
              value={modifiedWorkflow?.name || ''}
              onChange={(e) => setModifiedWorkflow({
                ...modifiedWorkflow,
                name: e.target.value
              })}
              margin="normal"
            />

            <Typography variant="h6" mt={2} mb={2}>Steps</Typography>
            
            {(modifiedWorkflow?.steps || []).map((step, index) => (
              <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phase"
                      value={step.phase || step.task_type}
                      onChange={(e) => {
                        const updatedSteps = [...modifiedWorkflow.steps];
                        updatedSteps[index] = { ...step, phase: e.target.value };
                        setModifiedWorkflow({ ...modifiedWorkflow, steps: updatedSteps });
                      }}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Duration (min)"
                      value={step.estimated_duration}
                      onChange={(e) => {
                        const updatedSteps = [...modifiedWorkflow.steps];
                        updatedSteps[index] = { ...step, estimated_duration: parseInt(e.target.value) };
                        setModifiedWorkflow({ ...modifiedWorkflow, steps: updatedSteps });
                      }}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Cognitive Load</InputLabel>
                      <Select
                        value={step.cognitive_load}
                        label="Cognitive Load"
                        onChange={(e) => {
                          const updatedSteps = [...modifiedWorkflow.steps];
                          updatedSteps[index] = { ...step, cognitive_load: e.target.value };
                          setModifiedWorkflow({ ...modifiedWorkflow, steps: updatedSteps });
                        }}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary">
                      Confidence: {Math.round(step.confidence * 100)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const updatedSteps = modifiedWorkflow.steps.filter((_, i) => i !== index);
                        setModifiedWorkflow({ ...modifiedWorkflow, steps: updatedSteps });
                      }}
                    >
                      Remove
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={() => {
                const newStep = {
                  phase: 'New Step',
                  estimated_duration: 30,
                  cognitive_load: 'medium',
                  confidence: 0.7,
                  task_type: 'custom'
                };
                setModifiedWorkflow({
                  ...modifiedWorkflow,
                  steps: [...(modifiedWorkflow.steps || []), newStep]
                });
              }}
              sx={{ mt: 1 }}
            >
              Add Step
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModificationDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onWorkflowModify(modifiedWorkflow);
              setModificationDialog(false);
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  const renderCustomTemplateDialog = () => {
    const [templateData, setTemplateData] = useState({
      name: '',
      project_context: currentProject || '',
      steps: []
    });

    return (
      <Dialog
        open={customTemplateDialog}
        onClose={() => setCustomTemplateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Custom Workflow Template</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Template Name"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Project Context"
            value={templateData.project_context}
            onChange={(e) => setTemplateData({ ...templateData, project_context: e.target.value })}
            margin="normal"
          />

          <Typography variant="h6" mt={2} mb={2}>Template Steps</Typography>
          
          {/* Similar step editing interface as modification dialog */}
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => {
              const newStep = {
                phase: 'Step ' + (templateData.steps.length + 1),
                estimated_duration: 30,
                cognitive_load: 'medium',
                task_type: 'custom'
              };
              setTemplateData({
                ...templateData,
                steps: [...templateData.steps, newStep]
              });
            }}
          >
            Add Step to Template
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomTemplateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              onCreateCustomTemplate(templateData);
              setCustomTemplateDialog(false);
            }}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (!workflowSuggestions.length) {
    return (
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <LightbulbIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">Predictive Workflows</Typography>
          </Box>
          
          <Alert severity="info">
            <Typography variant="body2">
              No workflow suggestions available. Start a task to generate AI-powered workflow predictions.
            </Typography>
          </Alert>

          <Box mt={2}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setCustomTemplateDialog(true)}
            >
              Create Custom Template
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <LightbulbIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5">Predictive Workflows</Typography>
          <Tooltip title="AI-generated task sequences based on project patterns and cognitive optimization">
            <IconButton size="small">
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setCustomTemplateDialog(true)}
          >
            Custom Template
          </Button>
          
          <Button
            startIcon={<PsychologyIcon />}
            variant={cognitiveOptimization ? 'contained' : 'outlined'}
            onClick={() => setCognitiveOptimization(!cognitiveOptimization)}
            size="small"
          >
            Cognitive Optimization
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Workflow Suggestions List */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" mb={2}>
            Suggested Workflows ({workflowSuggestions.length})
          </Typography>
          
          {workflowSuggestions.map((workflow, index) => 
            renderWorkflowCard(workflow, index)
          )}
        </Grid>

        {/* Detailed Workflow View */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" mb={2}>Workflow Details</Typography>
          {renderDetailedWorkflowView()}
        </Grid>
      </Grid>

      {/* Dialogs */}
      {renderModificationDialog()}
      {renderCustomTemplateDialog()}
    </Box>
  );
};

export default PredictiveWorkflowPanel;

// #endregion end: Predictive Workflow Panel
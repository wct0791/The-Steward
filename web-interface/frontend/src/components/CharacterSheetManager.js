import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Slider,
  Switch,
  FormControlLabel,
  TextField,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Snackbar
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Tune as TuneIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Lightbulb as CreativeIcon,
  Analytics as AnalyticalIcon,
  Code as CodeIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { ApiService } from '../services/api';

function CharacterSheetManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [characterSheet, setCharacterSheet] = useState(null);
  const [notification, setNotification] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Character sheet form state with defaults
  const [preferences, setPreferences] = useState({
    // Core preferences
    preferredSpeed: 7, // 1-10 scale (speed vs quality)
    localVsCloud: 3, // 1-10 scale (local first vs cloud first)
    creativityLevel: 5, // 1-10 scale
    analysisDepth: 6, // 1-10 scale
    
    // ADHD accommodations
    enableBreakReminders: true,
    shortResponseMode: false,
    visualStructuring: true,
    hyperfocusProtection: true,
    distractionFiltering: true,
    
    // Time-based preferences
    morningRoutingPreference: 'local',
    eveningRoutingPreference: 'cloud',
    workHoursRoutingPreference: 'balanced',
    
    // Task preferences
    taskTypePreferences: {
      creative: { preferredModels: ['gpt-4', 'claude-3.5-sonnet'], priority: 'high' },
      analytical: { preferredModels: ['claude-3.5-sonnet', 'gpt-4o'], priority: 'high' },
      coding: { preferredModels: ['codellama', 'gpt-4'], priority: 'medium' },
      general: { preferredModels: ['smollm3', 'llama'], priority: 'medium' }
    },
    
    // Usage patterns
    usageNotes: '',
    personalContext: ''
  });

  useEffect(() => {
    loadCharacterSheet();
  }, []);

  const loadCharacterSheet = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCharacterSheet();
      setCharacterSheet(data.characterSheet);
      
      // Merge loaded data with defaults
      if (data.characterSheet && Object.keys(data.characterSheet).length > 0) {
        setPreferences(prev => ({ ...prev, ...data.characterSheet }));
      }
      
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const updateTaskPreference = (taskType, field, value) => {
    setPreferences(prev => ({
      ...prev,
      taskTypePreferences: {
        ...prev.taskTypePreferences,
        [taskType]: {
          ...prev.taskTypePreferences[taskType],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await ApiService.updateCharacterSheet(preferences);
      setNotification({ message: 'Character sheet saved successfully!', severity: 'success' });
      setHasChanges(false);
    } catch (error) {
      setNotification({ message: 'Failed to save: ' + error.message, severity: 'error' });
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      preferredSpeed: 7,
      localVsCloud: 3,
      creativityLevel: 5,
      analysisDepth: 6,
      enableBreakReminders: true,
      shortResponseMode: false,
      visualStructuring: true,
      hyperfocusProtection: true,
      distractionFiltering: true,
      morningRoutingPreference: 'local',
      eveningRoutingPreference: 'cloud',
      workHoursRoutingPreference: 'balanced',
      taskTypePreferences: {
        creative: { preferredModels: ['gpt-4', 'claude-3.5-sonnet'], priority: 'high' },
        analytical: { preferredModels: ['claude-3.5-sonnet', 'gpt-4o'], priority: 'high' },
        coding: { preferredModels: ['codellama', 'gpt-4'], priority: 'medium' },
        general: { preferredModels: ['smollm3', 'llama'], priority: 'medium' }
      },
      usageNotes: '',
      personalContext: ''
    });
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load character sheet: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
            Character Sheet
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Configure your AI preferences and cognitive profile
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
          <Button 
            variant="contained" 
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Changes
          </Button>
        </Box>
      </Box>

      {hasChanges && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Remember to save your preferences.
        </Alert>
      )}

      {/* Core Preferences */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TuneIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Core Preferences</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Response Speed vs Quality</Typography>
              <Slider
                value={preferences.preferredSpeed}
                onChange={(e, value) => updatePreference('preferredSpeed', value)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: 'Quality' },
                  { value: 10, label: 'Speed' }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Local vs Cloud Preference</Typography>
              <Slider
                value={preferences.localVsCloud}
                onChange={(e, value) => updatePreference('localVsCloud', value)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: 'Local First' },
                  { value: 10, label: 'Cloud First' }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Creativity Level</Typography>
              <Slider
                value={preferences.creativityLevel}
                onChange={(e, value) => updatePreference('creativityLevel', value)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: 'Conservative' },
                  { value: 10, label: 'Creative' }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 3 }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Analysis Depth</Typography>
              <Slider
                value={preferences.analysisDepth}
                onChange={(e, value) => updatePreference('analysisDepth', value)}
                min={1}
                max={10}
                marks={[
                  { value: 1, label: 'Quick' },
                  { value: 10, label: 'Deep' }
                ]}
                valueLabelDisplay="auto"
                sx={{ mt: 2, mb: 3 }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* ADHD Accommodations */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PsychologyIcon sx={{ mr: 1, color: 'secondary.main' }} />
            <Typography variant="h6">ADHD Accommodations</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.enableBreakReminders}
                    onChange={(e) => updatePreference('enableBreakReminders', e.target.checked)}
                  />
                }
                label="Break Reminders"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Suggest breaks during long sessions
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.shortResponseMode}
                    onChange={(e) => updatePreference('shortResponseMode', e.target.checked)}
                  />
                }
                label="Short Response Mode"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Prefer concise, actionable responses
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.visualStructuring}
                    onChange={(e) => updatePreference('visualStructuring', e.target.checked)}
                  />
                }
                label="Visual Structuring"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Use bullet points, headers, clear formatting
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.hyperfocusProtection}
                    onChange={(e) => updatePreference('hyperfocusProtection', e.target.checked)}
                  />
                }
                label="Hyperfocus Protection"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Gentle reminders during extended sessions
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.distractionFiltering}
                    onChange={(e) => updatePreference('distractionFiltering', e.target.checked)}
                  />
                }
                label="Distraction Filtering"
              />
              <Typography variant="caption" display="block" color="text.secondary">
                Filter out irrelevant information
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Time-based Routing */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ScheduleIcon sx={{ mr: 1, color: 'info.main' }} />
            <Typography variant="h6">Time-based Routing Preferences</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Morning Preference</InputLabel>
                <Select
                  value={preferences.morningRoutingPreference}
                  label="Morning Preference"
                  onChange={(e) => updatePreference('morningRoutingPreference', e.target.value)}
                >
                  <MenuItem value="local">Local Models</MenuItem>
                  <MenuItem value="cloud">Cloud Models</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Work Hours Preference</InputLabel>
                <Select
                  value={preferences.workHoursRoutingPreference}
                  label="Work Hours Preference"
                  onChange={(e) => updatePreference('workHoursRoutingPreference', e.target.value)}
                >
                  <MenuItem value="local">Local Models</MenuItem>
                  <MenuItem value="cloud">Cloud Models</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Evening Preference</InputLabel>
                <Select
                  value={preferences.eveningRoutingPreference}
                  label="Evening Preference"
                  onChange={(e) => updatePreference('eveningRoutingPreference', e.target.value)}
                >
                  <MenuItem value="local">Local Models</MenuItem>
                  <MenuItem value="cloud">Cloud Models</MenuItem>
                  <MenuItem value="balanced">Balanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Task Type Preferences */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
            <Typography variant="h6">Task Type Preferences</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            {Object.entries(preferences.taskTypePreferences).map(([taskType, config]) => (
              <Grid item xs={12} md={6} key={taskType}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {taskType === 'creative' && <CreativeIcon sx={{ mr: 1 }} />}
                    {taskType === 'analytical' && <AnalyticalIcon sx={{ mr: 1 }} />}
                    {taskType === 'coding' && <CodeIcon sx={{ mr: 1 }} />}
                    {taskType === 'general' && <PersonIcon sx={{ mr: 1 }} />}
                    <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                      {taskType} Tasks
                    </Typography>
                  </Box>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={config.priority}
                      label="Priority"
                      onChange={(e) => updateTaskPreference(taskType, 'priority', e.target.value)}
                    >
                      <MenuItem value="high">High Priority</MenuItem>
                      <MenuItem value="medium">Medium Priority</MenuItem>
                      <MenuItem value="low">Low Priority</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Preferred Models:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {config.preferredModels.map((model) => (
                      <Chip 
                        key={model} 
                        label={model} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Personal Context */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: 'warning.main' }} />
            <Typography variant="h6">Personal Context & Notes</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Usage Notes"
                value={preferences.usageNotes}
                onChange={(e) => updatePreference('usageNotes', e.target.value)}
                placeholder="Describe your typical usage patterns, preferences, or any specific needs..."
                helperText="These notes help The Steward make better routing decisions for you"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Personal Context"
                value={preferences.personalContext}
                onChange={(e) => updatePreference('personalContext', e.target.value)}
                placeholder="Share any personal context that might influence AI interactions (work role, interests, etc.)"
                helperText="This information stays private and helps personalize responses"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.severity || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default CharacterSheetManager;
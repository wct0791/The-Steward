import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Computer as LocalIcon,
  CheckCircle as AvailableIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  PlayArrow as TestIcon,
  Settings as ConfigIcon,
  Refresh as RefreshIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { ApiService } from '../services/api';

function ModelSelector() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [models, setModels] = useState(null);
  const [addModelDialog, setAddModelDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [testingModel, setTestingModel] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Add model form state
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'local',
    endpoint: '',
    apiKey: '',
    description: ''
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getModels();
      setModels(data.models);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModel = async () => {
    try {
      // This would typically call an API endpoint to add a new model
      console.log('Adding model:', newModel);
      setNotification({ message: 'Model configuration saved', severity: 'success' });
      setAddModelDialog(false);
      setNewModel({ name: '', type: 'local', endpoint: '', apiKey: '', description: '' });
      loadModels(); // Refresh the list
    } catch (error) {
      setNotification({ message: 'Failed to add model: ' + error.message, severity: 'error' });
    }
  };

  const handleTestModel = async (model) => {
    setTestingModel(model.name);
    try {
      // Simulate model testing
      const testPrompt = "Hello, this is a test message.";
      const startTime = Date.now();
      
      // This would typically call the model via API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      const responseTime = Date.now() - startTime;
      
      const result = {
        success: true,
        responseTime,
        testPrompt,
        response: "Hello! I'm working properly.",
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, [model.name]: result }));
      setNotification({ message: `${model.name} test completed successfully`, severity: 'success' });
    } catch (error) {
      const result = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, [model.name]: result }));
      setNotification({ message: `${model.name} test failed`, severity: 'error' });
    } finally {
      setTestingModel(null);
    }
  };

  const handleAutoDiscover = async () => {
    try {
      setLoading(true);
      setNotification({ message: 'Discovering local models...', severity: 'info' });
      // This would scan for Ollama, Docker containers, etc.
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate discovery
      loadModels();
      setNotification({ message: 'Model discovery completed', severity: 'success' });
    } catch (error) {
      setNotification({ message: 'Discovery failed: ' + error.message, severity: 'error' });
    }
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
        Failed to load models: {error}
      </Alert>
    );
  }

  const renderModelList = (modelList, title, icon) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ ml: 1 }}>
            {title}
          </Typography>
          <Chip
            size="small"
            label={modelList?.length || 0}
            color="primary"
            sx={{ ml: 'auto' }}
          />
        </Box>
        
        <List dense>
          {modelList?.map((model, index) => (
            <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'stretch', pb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {model.status === 'available' ? (
                    <AvailableIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={model.name}
                  secondary={model.description || 'AI model'}
                  sx={{ flex: 1 }}
                />
                <Chip
                  size="small"
                  label={model.status}
                  color={model.status === 'available' ? 'success' : 'error'}
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 1, ml: 4 }}>
                <Tooltip title="Test Model">
                  <IconButton
                    size="small"
                    onClick={() => handleTestModel(model)}
                    disabled={testingModel === model.name}
                  >
                    {testingModel === model.name ? (
                      <CircularProgress size={16} />
                    ) : (
                      <TestIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Configure Model">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedModel(model);
                      setConfigDialog(true);
                    }}
                  >
                    <ConfigIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                {testResults[model.name] && (
                  <Tooltip title="Performance">
                    <IconButton size="small">
                      <SpeedIcon 
                        fontSize="small" 
                        color={testResults[model.name].success ? 'success' : 'error'}
                      />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              
              {/* Test results */}
              {testResults[model.name] && (
                <Box sx={{ mt: 1, ml: 4, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last test: {new Date(testResults[model.name].timestamp).toLocaleTimeString()}
                  </Typography>
                  {testResults[model.name].success ? (
                    <Typography variant="caption" display="block" color="success.main">
                      ✓ Response time: {testResults[model.name].responseTime}ms
                    </Typography>
                  ) : (
                    <Typography variant="caption" display="block" color="error.main">
                      ✗ Error: {testResults[model.name].error}
                    </Typography>
                  )}
                </Box>
              )}
            </ListItem>
          )) || (
            <ListItem>
              <ListItemText
                primary="No models available"
                secondary="Check your configuration"
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
            Model Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover, configure, and test AI models
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadModels}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<LocalIcon />}
            onClick={handleAutoDiscover}
            disabled={loading}
          >
            Auto-Discover
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddModelDialog(true)}
          >
            Add Model
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          {renderModelList(
            models?.local,
            'Local Models',
            <LocalIcon color="primary" />
          )}
        </Grid>
        
        <Grid item xs={12} md={6}>
          {renderModelList(
            models?.cloud,
            'Cloud Models', 
            <CloudIcon color="secondary" />
          )}
        </Grid>
      </Grid>

      {/* Add Model Dialog */}
      <Dialog open={addModelDialog} onClose={() => setAddModelDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Model</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Model Name"
                value={newModel.name}
                onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                placeholder="e.g., llama2, gpt-4, claude-3"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Model Type</InputLabel>
                <Select
                  value={newModel.type}
                  label="Model Type"
                  onChange={(e) => setNewModel({ ...newModel, type: e.target.value })}
                >
                  <MenuItem value="local">Local (Ollama, Docker)</MenuItem>
                  <MenuItem value="cloud">Cloud API</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {newModel.type === 'cloud' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Endpoint"
                    value={newModel.endpoint}
                    onChange={(e) => setNewModel({ ...newModel, endpoint: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API Key"
                    type="password"
                    value={newModel.apiKey}
                    onChange={(e) => setNewModel({ ...newModel, apiKey: e.target.value })}
                    placeholder="Your API key"
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={newModel.description}
                onChange={(e) => setNewModel({ ...newModel, description: e.target.value })}
                placeholder="Brief description of this model's capabilities"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddModelDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddModel} 
            variant="contained"
            disabled={!newModel.name.trim()}
          >
            Add Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* Configure Model Dialog */}
      <Dialog open={configDialog} onClose={() => setConfigDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configure {selectedModel?.name}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable for routing"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
              Include this model in smart routing decisions
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Model Priority
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select defaultValue="normal" size="small">
                <MenuItem value="high">High Priority</MenuItem>
                <MenuItem value="normal">Normal Priority</MenuItem>
                <MenuItem value="low">Low Priority (Fallback)</MenuItem>
              </Select>
            </FormControl>
            
            <Typography variant="subtitle2" gutterBottom>
              Use Cases
            </Typography>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Creative tasks"
              sx={{ display: 'block' }}
            />
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Analytical tasks"
              sx={{ display: 'block' }}
            />
            <FormControlLabel
              control={<Switch />}
              label="Code generation"
              sx={{ display: 'block' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog(false)}>Cancel</Button>
          <Button variant="contained">Save Configuration</Button>
        </DialogActions>
      </Dialog>

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

export default ModelSelector;
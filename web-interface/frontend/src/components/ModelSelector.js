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
  ListItemIcon
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Computer as LocalIcon,
  CheckCircle as AvailableIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { ApiService } from '../services/api';

function ModelSelector() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [models, setModels] = useState(null);

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
            <ListItem key={index}>
              <ListItemIcon>
                {model.status === 'available' ? (
                  <AvailableIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={model.name}
                secondary={model.description || 'AI model'}
              />
              <Chip
                size="small"
                label={model.status}
                color={model.status === 'available' ? 'success' : 'error'}
                variant="outlined"
              />
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Model Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        View and manage available AI models
      </Typography>

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
    </Box>
  );
}

export default ModelSelector;
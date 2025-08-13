import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { ApiService } from '../services/api';

function CharacterSheetManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [characterSheet, setCharacterSheet] = useState(null);

  useEffect(() => {
    loadCharacterSheet();
  }, []);

  const loadCharacterSheet = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getCharacterSheet();
      setCharacterSheet(data.characterSheet);
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
        Failed to load character sheet: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Character Sheet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your AI preferences and cognitive profile
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferences
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Character sheet management interface coming soon...
              </Typography>
              
              {characterSheet && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Current character sheet data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default CharacterSheetManager;
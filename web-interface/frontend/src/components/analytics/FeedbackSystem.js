// Feedback Loop Integration System
// Smart feedback collection and learning pipeline integration

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  Button,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Badge,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SwapHoriz as SwapIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Psychology as PsychologyIcon,
  Feedback as FeedbackIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { ApiService } from '../../services/api';

const FeedbackSystem = ({ responseData, onFeedbackSubmitted }) => {
  const [quickRating, setQuickRating] = useState(0);
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    satisfaction_rating: 0,
    quality_rating: 0,
    speed_rating: 0,
    feedback_text: '',
    should_use_different_model: false,
    preferred_model: '',
    routing_feedback: ''
  });
  const [submittedFeedback, setSubmittedFeedback] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [learningInsights, setLearningInsights] = useState([]);
  const [cognitiveLoadReporting, setCognitiveLoadReporting] = useState(null);

  useEffect(() => {
    // Load any pending learning insights for this session
    loadLearningInsights();
  }, []);

  const loadLearningInsights = async () => {
    try {
      const insights = await ApiService.request('GET', '/api/analytics/learning/character-sheet-suggestions');
      setLearningInsights(insights.data?.suggestions || []);
    } catch (error) {
      console.error('Error loading learning insights:', error);
    }
  };

  const handleQuickRating = async (rating) => {
    setQuickRating(rating);
    
    const quickFeedback = {
      performance_id: responseData?.metadata?.performance_id,
      routing_id: responseData?.routing_decision_id,
      satisfaction_rating: rating,
      quality_rating: rating,
      speed_rating: rating,
      feedback_text: `Quick rating: ${rating} stars`,
      preferred_model: null,
      routing_feedback: null
    };

    try {
      await ApiService.submitFeedback(quickFeedback);
      setSubmittedFeedback(true);
      setSnackbarMessage(`Thanks! Your ${rating}-star rating helps improve routing intelligence.`);
      setSnackbarOpen(true);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(quickFeedback);
      }
    } catch (error) {
      setSnackbarMessage('Error submitting feedback. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleDetailedFeedback = async () => {
    const detailedFeedback = {
      performance_id: responseData?.metadata?.performance_id,
      routing_id: responseData?.routing_decision_id,
      ...feedbackData
    };

    try {
      await ApiService.submitFeedback(detailedFeedback);
      setSubmittedFeedback(true);
      setShowDetailedFeedback(false);
      setSnackbarMessage('Detailed feedback submitted! This will improve future routing decisions.');
      setSnackbarOpen(true);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(detailedFeedback);
      }
    } catch (error) {
      setSnackbarMessage('Error submitting detailed feedback. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleCognitiveLoadReport = async (loadLevel) => {
    setCognitiveLoadReporting(loadLevel);
    
    try {
      await ApiService.request('POST', '/api/analytics/cognitive-load-report', {
        performance_id: responseData?.metadata?.performance_id,
        cognitive_load: loadLevel,
        timestamp: new Date().toISOString()
      });
      
      setSnackbarMessage(`Cognitive load (${loadLevel}/5) reported. This helps optimize ADHD accommodations.`);
      setSnackbarOpen(true);
      
      // Clear the reporting state after a delay
      setTimeout(() => setCognitiveLoadReporting(null), 2000);
    } catch (error) {
      setSnackbarMessage('Error reporting cognitive load.');
      setSnackbarOpen(true);
      setCognitiveLoadReporting(null);
    }
  };

  const handleSuggestionAction = async (suggestionId, action) => {
    try {
      const endpoint = action === 'accept' ? 'accept-suggestion' : 'reject-suggestion';
      await ApiService.request('POST', `/api/analytics/learning/${endpoint}`, {
        suggestionId,
        reason: action === 'reject' ? 'User preference' : null
      });
      
      setSnackbarMessage(`Suggestion ${action}ed! Your character sheet will be updated.`);
      setSnackbarOpen(true);
      
      // Reload insights
      loadLearningInsights();
    } catch (error) {
      setSnackbarMessage(`Error ${action}ing suggestion.`);
      setSnackbarOpen(true);
    }
  };

  if (!responseData) {
    return null;
  }

  return (
    <Box>
      {/* Quick Feedback Section */}
      {!submittedFeedback && (
        <Card variant="outlined" sx={{ mt: 2, border: '2px dashed #e0e0e0' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  How was this response?
                </Typography>
                <Rating
                  value={quickRating}
                  onChange={(event, newValue) => newValue && handleQuickRating(newValue)}
                  size="small"
                  icon={<StarIcon />}
                  emptyIcon={<StarIcon />}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Should have used a different model">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => setShowDetailedFeedback(true)}
                  >
                    <SwapIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Provide detailed feedback">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => setShowDetailedFeedback(true)}
                  >
                    <FeedbackIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* ADHD Cognitive Load Self-Reporting */}
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                🧠 Current cognitive load (helps optimize ADHD accommodations):
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    size="small"
                    variant={cognitiveLoadReporting === level ? 'contained' : 'outlined'}
                    color={level <= 2 ? 'success' : level <= 3 ? 'warning' : 'error'}
                    onClick={() => handleCognitiveLoadReport(level)}
                    sx={{ minWidth: 40, fontSize: '0.7rem' }}
                  >
                    {level}
                  </Button>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                1=Low focus, 5=Hyperfocus
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {submittedFeedback && (
        <Alert 
          severity="success" 
          sx={{ mt: 2 }}
          action={
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setSubmittedFeedback(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          ✅ Feedback received! This will improve future routing decisions.
        </Alert>
      )}

      {/* Learning Insights & Suggestions */}
      {learningInsights.length > 0 && (
        <Card sx={{ mt: 2, bgcolor: 'primary.50', border: '1px solid #1976d2' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h6" color="primary">
                🎯 Smart Suggestions
              </Typography>
              <Badge badgeContent={learningInsights.length} color="primary" />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Based on your usage patterns, here are some optimization suggestions:
            </Typography>

            {learningInsights.slice(0, 2).map((insight, index) => (
              <Alert
                key={insight.id || index}
                severity="info"
                sx={{ mb: 1 }}
                action={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleSuggestionAction(insight.id, 'accept')}
                    >
                      Apply
                    </Button>
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => handleSuggestionAction(insight.id, 'reject')}
                    >
                      Dismiss
                    </Button>
                  </Box>
                }
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>{insight.current}</strong> → <strong>{insight.suggested}</strong>
                </Typography>
                <Typography variant="caption">
                  {insight.reasoning}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={insight.confidence * 100} 
                    sx={{ height: 4, borderRadius: 2 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </Typography>
                </Box>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Feedback Dialog */}
      <Dialog 
        open={showDetailedFeedback} 
        onClose={() => setShowDetailedFeedback(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FeedbackIcon />
            Detailed Feedback & Routing Optimization
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Response Quality Ratings
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                  Overall Satisfaction
                </Typography>
                <Rating
                  value={feedbackData.satisfaction_rating}
                  onChange={(event, newValue) => 
                    setFeedbackData({...feedbackData, satisfaction_rating: newValue || 0})
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                  Content Quality
                </Typography>
                <Rating
                  value={feedbackData.quality_rating}
                  onChange={(event, newValue) => 
                    setFeedbackData({...feedbackData, quality_rating: newValue || 0})
                  }
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography component="legend" variant="body2" sx={{ mb: 1 }}>
                  Response Speed
                </Typography>
                <Rating
                  value={feedbackData.speed_rating}
                  onChange={(event, newValue) => 
                    setFeedbackData({...feedbackData, speed_rating: newValue || 0})
                  }
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Routing Feedback
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={feedbackData.should_use_different_model}
                    onChange={(e) => 
                      setFeedbackData({...feedbackData, should_use_different_model: e.target.checked})
                    }
                  />
                }
                label="Should have used a different model"
              />

              {feedbackData.should_use_different_model && (
                <TextField
                  fullWidth
                  label="Preferred Model"
                  value={feedbackData.preferred_model}
                  onChange={(e) => 
                    setFeedbackData({...feedbackData, preferred_model: e.target.value})
                  }
                  placeholder="e.g., gpt-4, claude, smollm3"
                  sx={{ mt: 2 }}
                />
              )}

              <TextField
                fullWidth
                label="Routing Feedback"
                multiline
                rows={3}
                value={feedbackData.routing_feedback}
                onChange={(e) => 
                  setFeedbackData({...feedbackData, routing_feedback: e.target.value})
                }
                placeholder="How could the model selection be improved?"
                sx={{ mt: 2 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Comments"
                multiline
                rows={3}
                value={feedbackData.feedback_text}
                onChange={(e) => 
                  setFeedbackData({...feedbackData, feedback_text: e.target.value})
                }
                placeholder="Any additional feedback about the response or experience?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDetailedFeedback(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDetailedFeedback}
            variant="contained"
            startIcon={<TrendingUpIcon />}
          >
            Submit & Improve Routing
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default FeedbackSystem;
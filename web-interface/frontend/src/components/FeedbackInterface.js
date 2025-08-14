import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Feedback as FeedbackIcon
} from '@mui/icons-material';
import { ApiService } from '../services/api';

function FeedbackInterface({ 
  open, 
  onClose, 
  performanceId, 
  routingId, 
  routingDecision,
  response 
}) {
  const [satisfactionRating, setSatisfactionRating] = useState(3);
  const [qualityRating, setQualityRating] = useState(3);
  const [speedRating, setSpeedRating] = useState(3);
  const [feedbackText, setFeedbackText] = useState('');
  const [routingFeedback, setRoutingFeedback] = useState('good_choice');
  const [preferredModel, setPreferredModel] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const feedbackData = {
        performance_id: performanceId,
        routing_id: routingId,
        satisfaction_rating: satisfactionRating,
        quality_rating: qualityRating,
        speed_rating: speedRating,
        feedback_text: feedbackText.trim() || null,
        routing_feedback: routingFeedback,
        preferred_model: preferredModel.trim() || null
      };

      await ApiService.submitFeedback(feedbackData);
      
      setSubmitted(true);
      setTimeout(() => {
        handleClose();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setSatisfactionRating(3);
    setQualityRating(3);
    setSpeedRating(3);
    setFeedbackText('');
    setRoutingFeedback('good_choice');
    setPreferredModel('');
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
    onClose();
  };

  if (!open) return null;

  if (submitted) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 4 }}>
          <FeedbackIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Thank you for your feedback!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your input helps The Steward learn and improve its routing decisions.
          </Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FeedbackIcon sx={{ mr: 1 }} />
          Rate this Response
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Context Information */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Response Context
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`Model: ${routingDecision?.selection?.model || 'Unknown'}`} 
              size="small" 
            />
            <Chip 
              label={`Task: ${routingDecision?.classification?.type || 'Unknown'}`} 
              size="small" 
            />
            <Chip 
              label={`Confidence: ${((routingDecision?.selection?.confidence || 0) * 100).toFixed(0)}%`} 
              size="small" 
            />
          </Box>
        </Box>

        {/* Rating Questions */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Typography variant="subtitle2">Overall Satisfaction</Typography>
            </FormLabel>
            <Rating
              value={satisfactionRating}
              onChange={(event, newValue) => setSatisfactionRating(newValue)}
              size="large"
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              How satisfied are you with this response?
            </Typography>
          </FormControl>

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Typography variant="subtitle2">Response Quality</Typography>
            </FormLabel>
            <Rating
              value={qualityRating}
              onChange={(event, newValue) => setQualityRating(newValue)}
              size="large"
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              How accurate and helpful was the response content?
            </Typography>
          </FormControl>

          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Typography variant="subtitle2">Response Speed</Typography>
            </FormLabel>
            <Rating
              value={speedRating}
              onChange={(event, newValue) => setSpeedRating(newValue)}
              size="large"
              sx={{ mt: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Was the response time appropriate for your needs?
            </Typography>
          </FormControl>
        </Box>

        {/* Routing Feedback */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">
              <Typography variant="subtitle2">Model Selection</Typography>
            </FormLabel>
            <RadioGroup
              value={routingFeedback}
              onChange={(e) => setRoutingFeedback(e.target.value)}
              sx={{ mt: 1 }}
            >
              <FormControlLabel
                value="good_choice"
                control={<Radio />}
                label="The Steward chose the right model"
              />
              <FormControlLabel
                value="wrong_model"
                control={<Radio />}
                label="A different model would have been better"
              />
              <FormControlLabel
                value="should_have_fallback"
                control={<Radio />}
                label="Should have used a fallback model"
              />
            </RadioGroup>
          </FormControl>

          {routingFeedback === 'wrong_model' && (
            <TextField
              label="Which model would have been better?"
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              placeholder="e.g., gpt-4, claude-3.5-sonnet, smollm3"
              size="small"
              sx={{ mt: 2, minWidth: 250 }}
            />
          )}
        </Box>

        {/* Additional Comments */}
        <TextField
          label="Additional feedback (optional)"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          multiline
          rows={3}
          fullWidth
          placeholder="Any specific issues, suggestions, or comments about this response..."
          sx={{ mb: 2 }}
        />

        <Typography variant="caption" color="text.secondary">
          Your feedback helps The Steward learn your preferences and improve routing decisions.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <ThumbUp />}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Quick feedback buttons for inline use
export function QuickFeedback({ performanceId, routingId, onFeedbackSubmitted }) {
  const [submitting, setSubmitting] = useState(null);

  const handleQuickFeedback = async (isPositive) => {
    try {
      setSubmitting(isPositive ? 'positive' : 'negative');

      const feedbackData = {
        performance_id: performanceId,
        routing_id: routingId,
        satisfaction_rating: isPositive ? 5 : 2,
        quality_rating: isPositive ? 5 : 2,
        speed_rating: 3, // Neutral for quick feedback
        routing_feedback: isPositive ? 'good_choice' : 'wrong_model'
      };

      await ApiService.submitFeedback(feedbackData);
      
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(isPositive);
      }

    } catch (error) {
      console.error('Quick feedback failed:', error);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button
        size="small"
        startIcon={submitting === 'positive' ? <CircularProgress size={16} /> : <ThumbUp />}
        onClick={() => handleQuickFeedback(true)}
        disabled={submitting !== null}
        color="success"
        variant="outlined"
      >
        Good
      </Button>
      <Button
        size="small"
        startIcon={submitting === 'negative' ? <CircularProgress size={16} /> : <ThumbDown />}
        onClick={() => handleQuickFeedback(false)}
        disabled={submitting !== null}
        color="error"
        variant="outlined"
      >
        Poor
      </Button>
    </Box>
  );
}

export default FeedbackInterface;
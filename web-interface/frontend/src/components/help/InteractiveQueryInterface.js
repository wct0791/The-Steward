// #region start: Interactive Query Interface Component
// Natural language help query interface with intelligent suggestions
// Handles real-time help requests and contextual guidance

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Send as SendIcon,
  QuestionAnswer as QuestionAnswerIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  ContentCopy as ContentCopyIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';

/**
 * InteractiveQueryInterface - Natural language help query system
 * 
 * Features:
 * - Natural language query processing
 * - Context-aware suggestions
 * - Query history
 * - Response feedback system
 * - Progressive disclosure based on user level
 */
const InteractiveQueryInterface = ({ userLevel, systemStatus, apiBase }) => {
  // State management
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  // Ref for auto-scrolling
  const responseRef = useRef(null);

  /**
   * Initialize with contextual suggestions based on system status
   */
  useEffect(() => {
    generateContextualSuggestions();
  }, [systemStatus, userLevel]);

  /**
   * Auto-scroll to response when it updates
   */
  useEffect(() => {
    if (response && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [response]);

  /**
   * Generate contextual help suggestions
   */
  const generateContextualSuggestions = () => {
    const baseSuggestions = [
      'What is smart routing?',
      'How do I set up my character sheet?',
      'What are the available features?',
      'How does ambient intelligence work?'
    ];

    const contextualSuggestions = [];

    // Add suggestions based on system status
    if (systemStatus) {
      if (systemStatus.configuration?.character_sheet?.completeness_score < 75) {
        contextualSuggestions.push('How to complete my character sheet setup?');
      }

      if (systemStatus.integrations?.ambient?.status !== 'active') {
        contextualSuggestions.push('How to enable ambient intelligence?');
      }

      if (systemStatus.performance?.efficiency_score < 80) {
        contextualSuggestions.push('How to optimize system performance?');
      }
    }

    // Add user-level specific suggestions
    if (userLevel === 'beginner') {
      contextualSuggestions.unshift('What can The Steward do for me?');
      contextualSuggestions.push('How do I get started?');
    } else if (userLevel === 'advanced') {
      contextualSuggestions.push('How to configure advanced routing preferences?');
      contextualSuggestions.push('What automation rules are available?');
    }

    setSuggestions([...contextualSuggestions, ...baseSuggestions].slice(0, 6));
  };

  /**
   * Handle query submission
   */
  const handleQuerySubmit = async (queryText = query) => {
    if (!queryText.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: queryText,
          userLevel,
          context: {
            systemStatus: systemStatus ? {
              health: systemStatus.system_health,
              capabilities: systemStatus.capabilities
            } : null
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setResponse({
          query: queryText,
          response: data.response,
          analysis: data.query_analysis,
          sessionId: data.session_id,
          timestamp: new Date().toISOString()
        });

        // Add to history
        setQueryHistory(prev => [...prev, {
          query: queryText,
          timestamp: new Date().toISOString(),
          success: true
        }].slice(-10)); // Keep last 10 queries

      } else {
        setError(data.error || 'Failed to process query');
        
        // Show fallback response if available
        if (data.fallback_response) {
          setResponse({
            query: queryText,
            response: data.fallback_response,
            isFallback: true,
            timestamp: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.error('Error processing query:', error);
      setError('Failed to connect to help system');
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  /**
   * Handle suggestion click
   */
  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleQuerySubmit(suggestion);
  };

  /**
   * Clear current response and query
   */
  const clearResponse = () => {
    setResponse(null);
    setError(null);
    setQuery('');
  };

  /**
   * Copy response to clipboard
   */
  const copyToClipboard = () => {
    if (response) {
      const textToCopy = `Query: ${response.query}\n\nResponse: ${JSON.stringify(response.response, null, 2)}`;
      navigator.clipboard.writeText(textToCopy);
    }
  };

  /**
   * Handle response feedback
   */
  const handleFeedback = (isHelpful) => {
    // In a real implementation, this would send feedback to the backend
    console.log(`Response feedback: ${isHelpful ? 'helpful' : 'not helpful'}`);
    // Could show a toast notification confirming feedback was received
  };

  /**
   * Render response content based on type
   */
  const renderResponse = (responseData) => {
    if (!responseData) return null;

    const { response: resp } = responseData;

    // Handle different response types
    if (resp.type === 'how_to_guide') {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            {resp.title}
          </Typography>
          
          {resp.steps && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Steps to Follow:
              </Typography>
              <List dense>
                {resp.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip label={index + 1} size="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {resp.tips && resp.tips.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Tips:
              </Typography>
              <List dense>
                {resp.tips.map((tip, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={tip} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {resp.suggestions && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Related Questions:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {resp.suggestions.slice(0, 3).map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    clickable
                    onClick={() => handleSuggestionClick(suggestion)}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      );
    }

    if (resp.type === 'capability_explanation') {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            {resp.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {resp.description}
          </Typography>

          {resp.key_features && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Key Features:
              </Typography>
              <List dense>
                {resp.key_features.map((feature, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {resp.benefits && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="secondary" gutterBottom>
                Benefits:
              </Typography>
              <List dense>
                {resp.benefits.map((benefit, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={benefit} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      );
    }

    if (resp.type === 'troubleshooting_guide') {
      return (
        <Box>
          <Typography variant="h6" gutterBottom>
            Troubleshooting: {resp.issue_type}
          </Typography>
          
          {resp.steps && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Troubleshooting Steps:
              </Typography>
              <List dense>
                {resp.steps.map((step, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Chip label={index + 1} size="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={step} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {resp.additional_guidance && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                {resp.additional_guidance}
              </Typography>
            </Alert>
          )}
        </Box>
      );
    }

    // Fallback for other response types
    return (
      <Box>
        {resp.title && (
          <Typography variant="h6" gutterBottom>
            {resp.title}
          </Typography>
        )}
        
        {resp.message ? (
          <Typography variant="body1" paragraph>
            {resp.message}
          </Typography>
        ) : resp.description ? (
          <Typography variant="body1" paragraph>
            {resp.description}
          </Typography>
        ) : (
          <Typography variant="body1" paragraph>
            {JSON.stringify(resp, null, 2)}
          </Typography>
        )}

        {resp.suggestions && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Try asking:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {resp.suggestions.slice(0, 4).map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  clickable
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Query Input */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ask The Steward Anything
        </Typography>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your question here... (e.g., 'How do I set up routing preferences?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleQuerySubmit()}
            multiline
            maxRows={3}
            disabled={loading}
          />
          <Button
            variant="contained"
            onClick={() => handleQuerySubmit()}
            disabled={!query.trim() || loading}
            sx={{ minWidth: 100 }}
          >
            {loading ? <CircularProgress size={20} /> : <SendIcon />}
          </Button>
        </Box>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <AutoAwesomeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Suggested questions:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  clickable
                  variant="outlined"
                  onClick={() => handleSuggestionClick(suggestion)}
                />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <Card ref={responseRef} sx={{ mb: 3 }}>
          <CardHeader
            title="Response"
            action={
              <Box>
                <Tooltip title="Copy response">
                  <IconButton onClick={copyToClipboard}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear response">
                  <IconButton onClick={clearResponse}>
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            }
            avatar={<QuestionAnswerIcon color="primary" />}
          />
          <CardContent>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              <strong>Your question:</strong> {response.query}
            </Typography>
            
            {response.isFallback && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This is a general response. For more specific help, try rephrasing your question.
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />
            
            {renderResponse(response)}
            
            {/* Response Feedback */}
            <Box mt={3} pt={2} borderTop={1} borderColor="divider">
              <Box display="flex" alignItems="center" justifyContent="between">
                <Typography variant="body2" color="textSecondary">
                  Was this response helpful?
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback(true)}
                    sx={{ mr: 1 }}
                  >
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleFeedback(false)}
                  >
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Query History */}
      {queryHistory.length > 0 && (
        <Card>
          <CardHeader
            title="Recent Questions"
            avatar={<HistoryIcon color="primary" />}
          />
          <CardContent>
            <List dense>
              {queryHistory.slice().reverse().map((item, index) => (
                <ListItem 
                  key={index}
                  button
                  onClick={() => handleSuggestionClick(item.query)}
                >
                  <ListItemText 
                    primary={item.query}
                    secondary={new Date(item.timestamp).toLocaleString()}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default InteractiveQueryInterface;

// #endregion end: Interactive Query Interface Component
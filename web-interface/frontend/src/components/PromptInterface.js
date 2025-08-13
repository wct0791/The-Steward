import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { ApiService } from '../services/api';
import RoutingVisualization from './RoutingVisualization';
import ResponseDisplay from './ResponseDisplay';

function PromptInterface() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [routingDecision, setRoutingDecision] = useState(null);
  const [showRouting, setShowRouting] = useState(true);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [settings] = useState({
    temperature: 0.7,
    maxTokens: 1500,
    localOnly: false,
    showReasoningSteps: true
  });

  const inputRef = useRef(null);
  const responseEndRef = useRef(null);
  const processingRef = useRef(new Set());
  const submissionRef = useRef(false);
  const lastSubmissionRef = useRef(0);

  // Auto-scroll to bottom when conversation history updates
  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !isMobile) {
      inputRef.current.focus();
    }
  }, [isMobile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const now = Date.now();
    
    // Debounce rapid submissions (prevent within 500ms)
    if (now - lastSubmissionRef.current < 500) {
      return;
    }
    
    if (!prompt.trim() || isLoading) {
      return;
    }
    
    lastSubmissionRef.current = now;

    const currentPrompt = prompt.trim();
    
    // Prevent duplicate submissions using multiple deduplication strategies
    // Check if the same prompt is currently being processed
    if (processingRef.current.has(currentPrompt)) {
      return;
    }
    
    // Additional protection against rapid successive submissions
    if (submissionRef.current) {
      return;
    }
    
    processingRef.current.add(currentPrompt);
    submissionRef.current = true;
    
    // Auto-reset submission flag after a short delay as backup
    setTimeout(() => {
      submissionRef.current = false;
    }, 1000);
    
    setPrompt('');
    setIsLoading(true);
    setRoutingDecision(null);

    // Add prompt to conversation history
    const newEntry = {
      id: Date.now(),
      prompt: currentPrompt,
      timestamp: new Date(),
      loading: true
    };
    
    setConversationHistory(prev => [...prev, newEntry]);

    try {
      const startTime = Date.now();
      console.log('📡 MAKING API CALL', {
        prompt: currentPrompt,
        attempt: Date.now(),
        isLoading,
        processingSetSize: processingRef.current.size
      });

      // Process prompt with smart routing
      const result = await ApiService.processPrompt(currentPrompt, {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        localOnly: settings.localOnly,
      });

      const totalTime = Date.now() - startTime;

      // Update conversation history with results
      setConversationHistory(prev => 
        prev.map(entry => 
          entry.id === newEntry.id 
            ? { 
                ...entry, 
                loading: false,
                response: result.response,
                routingDecision: result.routingDecision,
                totalTime,
                success: result.success
              }
            : entry
        )
      );

      // Only set routing decision for the top visualization, not response to prevent duplicates
      setRoutingDecision(result.routingDecision);

    } catch (error) {
      console.error('Failed to process prompt:', error);

      // Update conversation history with error
      setConversationHistory(prev => 
        prev.map(entry => 
          entry.id === newEntry.id 
            ? { 
                ...entry, 
                loading: false,
                error: error.message
              }
            : entry
        )
      );
    } finally {
      setIsLoading(false);
      // Reset deduplication flags after completion
      processingRef.current.delete(currentPrompt);
      submissionRef.current = false;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Don't call handleSubmit directly - let the form's onSubmit handle it
      // This prevents double submission when Enter triggers both keypress and form submit
      const form = e.target.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const toggleRoutingView = () => {
    setShowRouting(!showRouting);
  };

  const clearHistory = () => {
    setConversationHistory([]);
    setRoutingDecision(null);
  };

  return (
    <Box sx={{ maxWidth: '100%', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Smart AI Interface
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Intelligent model routing with character sheet integration
        </Typography>
        
        {/* Quick Stats */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Conversations
              </Typography>
              <Typography variant="h6">
                {conversationHistory.length}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Routing Mode
              </Typography>
              <Typography variant="h6">
                {settings.localOnly ? 'Local' : 'Smart'}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Temperature
              </Typography>
              <Typography variant="h6">
                {settings.temperature}
              </Typography>
            </Card>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Card sx={{ textAlign: 'center', py: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Max Tokens
              </Typography>
              <Typography variant="h6">
                {settings.maxTokens}
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Smart Routing Visualization */}
      <AnimatePresence>
        {showRouting && routingDecision && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card sx={{ mb: 3, overflow: 'visible' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <BrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    Smart Routing Decision
                  </Typography>
                  <IconButton
                    onClick={toggleRoutingView}
                    size="small"
                  >
                    <ExpandLessIcon />
                  </IconButton>
                </Box>
                
                <RoutingVisualization routingDecision={routingDecision} />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conversation History */}
      {conversationHistory.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Conversation History</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={clearHistory}
              disabled={isLoading}
            >
              Clear History
            </Button>
          </Box>
          
          {conversationHistory.map((entry) => (
            <Card key={entry.id} sx={{ mb: 2 }}>
              <CardContent>
                {/* Prompt */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    You • {entry.timestamp.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body1">
                    {entry.prompt}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Response */}
                {entry.loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <LinearProgress sx={{ flexGrow: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Processing...
                    </Typography>
                  </Box>
                ) : entry.error ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {entry.error}
                  </Alert>
                ) : entry.response ? (
                  <ResponseDisplay 
                    response={entry.response} 
                    routingDecision={entry.routingDecision}
                    showRouting={settings.showReasoningSteps}
                  />
                ) : null}
              </CardContent>
            </Card>
          ))}
          
          <div ref={responseEndRef} />
        </Box>
      )}

      {/* Current Response section removed - responses now only shown in conversation history to prevent duplicates */}

      {/* Prompt Input */}
      <Card sx={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                ref={inputRef}
                multiline
                maxRows={4}
                fullWidth
                placeholder="Ask me anything... (Shift+Enter for new line, Enter to send)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                variant="outlined"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <Button
                type="submit"
                variant="contained"
                disabled={!prompt.trim() || isLoading}
                startIcon={isLoading ? null : <SendIcon />}
                sx={{ 
                  minWidth: { xs: 48, sm: 120 },
                  height: 56,
                  borderRadius: 2,
                }}
              >
                {isMobile ? null : (isLoading ? 'Processing...' : 'Send')}
              </Button>
            </Box>
          </form>

          {/* Loading Progress */}
          {isLoading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Smart routing analysis and AI processing...
              </Typography>
            </Box>
          )}

          {/* Show/Hide Routing Toggle */}
          {routingDecision && !showRouting && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                startIcon={<ExpandMoreIcon />}
                onClick={toggleRoutingView}
                size="small"
                variant="text"
              >
                Show Routing Decision
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default PromptInterface;
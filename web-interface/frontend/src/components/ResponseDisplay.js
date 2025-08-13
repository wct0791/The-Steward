import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  useTheme
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Psychology as BrainIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion } from 'framer-motion';

function ResponseDisplay({ response, routingDecision, showRouting = true }) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  if (!response) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Custom components for markdown rendering
  const markdownComponents = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (!inline && language) {
        return (
          <Box sx={{ my: 2 }}>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              customStyle={{
                borderRadius: theme.shape.borderRadius,
                fontSize: '0.875rem',
              }}
              {...props}
            >
              {String(children).replace(/\\n$/, '')}
            </SyntaxHighlighter>
          </Box>
        );
      }
      
      return (
        <code
          className={className}
          style={{
            backgroundColor: theme.palette.grey[100],
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: '0.875rem',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    blockquote: ({ children }) => (
      <Paper
        sx={{
          p: 2,
          my: 2,
          borderLeft: 4,
          borderColor: 'primary.main',
          backgroundColor: 'grey.50',
        }}
        elevation={0}
      >
        <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
          {children}
        </Typography>
      </Paper>
    ),
    
    pre: ({ children }) => (
      <Box sx={{ my: 2 }}>
        {children}
      </Box>
    ),
  };

  const getModelIcon = (modelName) => {
    // Return appropriate icon based on model type
    if (modelName?.includes('gpt')) return '🤖';
    if (modelName?.includes('claude')) return '🎭';
    if (modelName?.includes('smollm')) return '⚡';
    if (modelName?.includes('llama')) return '🦙';
    return '🤖';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Response Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {response.error ? (
            <ErrorIcon color="error" />
          ) : (
            <CheckIcon color="success" />
          )}
          <Typography variant="subtitle2" color="text.secondary">
            {response.error ? 'Error' : 'Response'} • {response.model_used || 'Unknown Model'}
          </Typography>
          {response.model_used && (
            <Chip
              size="small"
              label={`${getModelIcon(response.model_used)} ${response.model_used}`}
              variant="outlined"
              color="primary"
            />
          )}
        </Box>

        {!response.error && (
          <Tooltip title={copied ? 'Copied!' : 'Copy response'}>
            <IconButton
              size="small"
              onClick={handleCopy}
              color={copied ? 'success' : 'default'}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Error Display */}
      {response.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>{response.error.message || 'An error occurred'}</strong>
          </Typography>
          {response.error.details && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {response.error.details}
            </Typography>
          )}
        </Alert>
      ) : (
        <>
          {/* Response Content */}
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'background.paper',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
            elevation={0}
          >
            <Typography
              component="div"
              variant="body1"
              sx={{
                lineHeight: 1.7,
                '& > *:first-of-type': { mt: 0 },
                '& > *:last-child': { mb: 0 },
              }}
            >
              <ReactMarkdown components={markdownComponents}>
                {response.content}
              </ReactMarkdown>
            </Typography>
          </Paper>

          {/* Response Metadata */}
          {response.metadata && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Metadata:
              </Typography>
              
              {response.metadata.usage && (
                <Chip
                  size="small"
                  label={`${response.metadata.usage.total_tokens || 'N/A'} tokens`}
                  variant="outlined"
                />
              )}
              
              {response.metadata.response_time && (
                <Chip
                  size="small"
                  label={`${response.metadata.response_time}ms`}
                  variant="outlined"
                />
              )}
              
              {response.metadata.format && (
                <Chip
                  size="small"
                  label={response.metadata.format}
                  variant="outlined"
                />
              )}

              {response.metadata.finish_reason && (
                <Chip
                  size="small"
                  label={response.metadata.finish_reason}
                  variant="outlined"
                  color={response.metadata.finish_reason === 'stop' ? 'success' : 'warning'}
                />
              )}
            </Box>
          )}

          {/* Smart Routing Summary */}
          {showRouting && routingDecision && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BrainIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Smart Routing Summary
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {routingDecision.classification?.type && (
                  <Chip
                    size="small"
                    label={`Task: ${routingDecision.classification.type}`}
                    color="success"
                    variant="outlined"
                  />
                )}
                
                {routingDecision.selection?.confidence && (
                  <Chip
                    size="small"
                    label={`${Math.round(routingDecision.selection.confidence * 100)}% confident`}
                    color={
                      routingDecision.selection.confidence >= 0.8 ? 'success' :
                      routingDecision.selection.confidence >= 0.6 ? 'warning' : 'error'
                    }
                    variant="outlined"
                  />
                )}
                
                {routingDecision.selection?.tier && (
                  <Chip
                    size="small"
                    label={routingDecision.selection.tier}
                    color="info"
                    variant="outlined"
                  />
                )}

                {routingDecision.selection?.routing_strategy && (
                  <Chip
                    size="small"
                    label={routingDecision.selection.routing_strategy.replace(/_/g, ' ')}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Box>
              
              {routingDecision.selection?.reason && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Routing reason: {routingDecision.selection.reason}
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

export default ResponseDisplay;
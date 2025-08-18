import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Box, 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Chat as ChatIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  Build as SystemIcon
} from '@mui/icons-material';

import PromptInterface from './components/PromptInterface';
import PerformanceDashboard from './components/PerformanceDashboard';
import CharacterSheetManager from './components/CharacterSheetManager';
import ModelSelector from './components/ModelSelector';
import SystemControl from './components/SystemControl';
import { ApiService } from './services/api';
import { WebSocketService } from './services/websocket';

const DRAWER_WIDTH = 240;

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('prompt');
  const [apiStatus, setApiStatus] = useState('connecting');
  const [wsConnected, setWsConnected] = useState(false);
  const [notification, setNotification] = useState(null);

  // Initialize services
  useEffect(() => {
    // Check API health
    ApiService.checkHealth()
      .then(() => {
        setApiStatus('connected');
      })
      .catch(() => {
        setApiStatus('error');
        setNotification({
          message: 'Unable to connect to The Steward API',
          severity: 'error'
        });
      });

    // Initialize WebSocket connection
    WebSocketService.connect();
    WebSocketService.onConnect(() => setWsConnected(true));
    WebSocketService.onDisconnect(() => setWsConnected(false));
    WebSocketService.onMessage((message) => {
      if (message.type === 'prompt_processed') {
        setNotification({
          message: 'Prompt processed successfully',
          severity: 'success'
        });
      }
    });

    return () => {
      WebSocketService.disconnect();
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const menuItems = [
    { id: 'prompt', label: 'Quick Chat', icon: <ChatIcon />, path: '/' },
    { id: 'models', label: 'Model Management', icon: <SettingsIcon />, path: '/models' },
    { id: 'character', label: 'Character Sheet', icon: <PersonIcon />, path: '/character' },
    { id: 'performance', label: 'Performance & Analytics', icon: <AnalyticsIcon />, path: '/performance' },
    { id: 'system', label: 'System Control', icon: <SystemIcon />, path: '/system' },
  ];

  const drawer = (
    <Box>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HomeIcon color="primary" />
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            The Steward
          </Typography>
        </Box>
      </Toolbar>
      
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              selected={currentView === item.id}
              onClick={() => handleViewChange(item.id)}
              sx={{
                borderRadius: 1,
                mx: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Connection Status */}
      <Box sx={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: apiStatus === 'connected' ? 'success.main' : 'error.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            API: {apiStatus}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: wsConnected ? 'success.main' : 'warning.main',
            }}
          />
          <Typography variant="caption" color="text.secondary">
            WebSocket: {wsConnected ? 'connected' : 'disconnected'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );


  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* App Bar */}
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            ml: { md: `${DRAWER_WIDTH}px` },
            backgroundColor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {menuItems.find(item => item.id === currentView)?.label || 'The Steward'}
            </Typography>

            {/* Status indicators */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: apiStatus === 'connected' ? 'success.main' : 'error.main',
                }}
              />
            </Box>
          </Toolbar>
        </AppBar>

        {/* Navigation Drawer */}
        <Box
          component="nav"
          sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                backgroundColor: 'background.paper',
              },
            }}
          >
            {drawer}
          </Drawer>
          
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH,
                backgroundColor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            backgroundColor: 'background.default',
          }}
        >
          <Toolbar />
          
          <Container maxWidth="lg" sx={{ py: 3, px: { xs: 2, sm: 3 } }}>
            <Routes>
              <Route path="/" element={<PromptInterface />} />
              <Route path="/models" element={<ModelSelector />} />
              <Route path="/character" element={<CharacterSheetManager />} />
              <Route path="/performance" element={<PerformanceDashboard />} />
              <Route path="/system" element={<SystemControl />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Box>

        {/* Notifications */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {notification && (
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.severity}
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
    </Router>
  );
}

export default App;
import React from 'react';
import ReactDOM from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import App from './App';
import theme from './theme';
import './index.css';

// Register service worker for PWA capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));

// Temporarily disable StrictMode to prevent duplicate API calls in development
// TODO: Re-enable after ensuring all side effects are properly handled
const AppContent = (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);

root.render(
  process.env.NODE_ENV === 'production' ? (
    <React.StrictMode>{AppContent}</React.StrictMode>
  ) : (
    AppContent
  )
);
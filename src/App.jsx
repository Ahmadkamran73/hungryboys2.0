import React from 'react';
import AppRoutes from './routes/AppRoutes';
import WhatsAppIcon from './components/WhatsAppIcon';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './context/ThemeContext';
import './styles/theme.css';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <div>
          {/* Render Your AppRoutes to handle routing */}
          <AppRoutes />

          {/* WhatsApp Icon, which is globally accessible */}
          <WhatsAppIcon />
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

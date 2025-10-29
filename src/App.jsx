import React from 'react';
import AppRoutes from './routes/AppRoutes';
import WhatsAppIcon from './components/WhatsAppIcon';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div>
        {/* Render your AppRoutes to handle routing */}
        <AppRoutes />

        {/* WhatsApp Icon, which is globally accessible */}
        <WhatsAppIcon />
      </div>
    </ErrorBoundary>
  );
}

export default App;

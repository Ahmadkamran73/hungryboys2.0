import React from 'react';
import AppRoutes from './routes/AppRoutes'; // Import your routes component
import WhatsAppIcon from './components/WhatsAppIcon'; // Import the WhatsApp Icon component

function App() {
  return (
    <div>
      {/* Render your AppRoutes to handle routing */}
      <AppRoutes />

      {/* WhatsApp Icon, which is globally accessible */}
      <WhatsAppIcon />
    </div>
  );
}

export default App;

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { CartProvider } from "./context/CartContext";
import { UniversityProvider } from "./context/UniversityContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <UniversityProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </UniversityProvider>
    </AuthProvider>
  </React.StrictMode>,
)

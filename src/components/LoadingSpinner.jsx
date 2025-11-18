import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading...", fullscreen = false }) => {
  return (
    <div className={`loading-container-modern ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="loading-content-modern">
        {/* Animated Ripple Circles */}
        <div className="ripple-container">
          <div className="ripple-circle ripple-1"></div>
          <div className="ripple-circle ripple-2"></div>
          <div className="ripple-circle ripple-3"></div>
        </div>

        {/* Main Loading Text */}
        <div className="loading-main-text">
          <h1 className="loading-brand">Hungry Boys</h1>
        </div>

        {/* Subtitle with dots animation */}
        <div className="loading-subtitle-container">
          <p className="loading-subtitle">{message}</p>
          <div className="loading-dots-text">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
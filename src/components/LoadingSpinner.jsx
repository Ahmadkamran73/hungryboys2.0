import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading...", fullscreen = false }) => {
  return (
    <div className={`loading-container-modern ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="loading-content-modern">
        {/* Modern Spinner with Dots */}
        <div className="spinner-modern">
          <div className="spinner-circle">
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="45" stroke="url(#spinnerGradient)" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="spinner-dots">
            <span className="dot dot-1"></span>
            <span className="dot dot-2"></span>
            <span className="dot dot-3"></span>
            <span className="dot dot-4"></span>
          </div>
        </div>

        {/* Loading Text */}
        <div className="loading-text-modern">
          <h3 className="loading-title">{message}</h3>
          <div className="loading-dots-text">
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
            <span className="loading-dot"></span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="loading-progress">
          <div className="progress-bar-modern"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
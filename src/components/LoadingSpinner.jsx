import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
          <div className="spinner-ring"></div>
        </div>
        <div className="loading-text">
          <span className="loading-letter">{message.split('').map((letter, index) => (
            <span 
              key={index} 
              className="loading-char"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner; 
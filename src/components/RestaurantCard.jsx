import React from 'react';
import { Link } from "react-router-dom";
import { isRestaurantOpen, getNextOpeningTime, getNextClosingTime } from "../utils/isRestaurantOpen";
import "../styles/RestaurantCard.css"; 

const RestaurantCard = ({ id, name, location, cuisine, openTime, closeTime, is24x7 }) => {
  const isOpen = isRestaurantOpen({ openTime, closeTime, is24x7 });
  const nextOpeningTime = getNextOpeningTime({ openTime, closeTime, is24x7 });
  const nextClosingTime = getNextClosingTime({ openTime, closeTime, is24x7 });

  // Generate a consistent gradient based on restaurant name
  const getGradient = (name) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  return (
    <Link to={`/menu/${id}`} className="restaurant-card-link">
      <div className="restaurant-card">
        {/* Image/Gradient Header */}
        <div className="restaurant-card-header" style={{ background: getGradient(name) }}>
          <div className="restaurant-card-overlay">
            {/* Status Badge */}
            <div className={`restaurant-status-badge ${isOpen ? 'open' : 'closed'}`}>
              <span className="status-dot"></span>
              {isOpen ? 'Open Now' : 'Closed'}
            </div>
            
            {/* Restaurant Icon */}
            <div className="restaurant-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2M7 2v20M17 2v20" />
                <path d="M21 12H3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="restaurant-card-content">
          {/* Restaurant Name */}
          <h3 className="restaurant-name">{name}</h3>

          {/* Meta Information */}
          <div className="restaurant-meta">
            <div className="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{location}</span>
            </div>

            <div className="meta-item cuisine">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>{cuisine}</span>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="restaurant-hours">
            {is24x7 ? (
              <div className="hours-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Open 24/7</span>
              </div>
            ) : isOpen ? (
              <div className="hours-info">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Closes at {nextClosingTime || closeTime}</span>
              </div>
            ) : (
              <div className="hours-info closed">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>Opens at {nextOpeningTime || openTime}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button className="restaurant-view-menu">
            <span>View Menu</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;  
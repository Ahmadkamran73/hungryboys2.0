import React from 'react';
import { Link } from "react-router-dom";
import { isRestaurantOpen, getNextOpeningTime, getNextClosingTime } from "../utils/isRestaurantOpen";
import "../styles/RestaurantCard.css"; 

const RestaurantCard = ({ id, name, location, cuisine, openTime, closeTime, is24x7 }) => {
  const isOpen = isRestaurantOpen({ openTime, closeTime, is24x7 });
  const nextOpeningTime = getNextOpeningTime({ openTime, closeTime, is24x7 });
  const nextClosingTime = getNextClosingTime({ openTime, closeTime, is24x7 });

  return (
    <div className="restaurant-card">
      <h2 className="fw-bold fs-5">{name}</h2>
      <p className="text-secondary mt-2">{location}</p>
      <p className="text-danger mt-1" style={{ fontWeight: 500 }}>{cuisine}</p>
      
      {/* Restaurant Status */}
      <div className="mt-2">
        {isOpen ? (
          <p className="text-success mb-1" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            <i className="fas fa-circle text-success me-1" style={{ fontSize: '0.6rem' }}></i>
            Open now {nextClosingTime && `(closes at ${nextClosingTime})`}
          </p>
        ) : (
          <p className="text-danger mb-1" style={{ fontSize: '0.9rem', fontWeight: 500 }}>
            <i className="fas fa-circle text-danger me-1" style={{ fontSize: '0.6rem' }}></i>
            Closed {nextOpeningTime && `(opens at ${nextOpeningTime})`}
          </p>
        )}
      </div>
      
      <Link to={`/menu/${id}`}>
        <button className="restaurant-button">View Menu</button>
      </Link>
    </div>
  );
};

export default RestaurantCard;  
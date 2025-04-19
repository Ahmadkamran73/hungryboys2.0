import React from 'react';
import { Link } from "react-router-dom";
import "../styles/RestaurantCard.css"; 

const RestaurantCard = ({ id, name, location, cuisine }) => {
  return (
    <div className="restaurant-card">
      <h2 className="fw-bold fs-5">{name}</h2>
      <p className="text-secondary mt-2">{location}</p>
      <p className="text-danger mt-1" style={{ fontWeight: 500 }}>{cuisine}</p>
      <Link to={`/menu/${id}`}>
        <button className="restaurant-button">View Menu</button>
      </Link>
    </div>
  );
};

export default RestaurantCard;  
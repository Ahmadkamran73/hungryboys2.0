import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // External CSS for styling

function Home() {
  return (
    <div className="home-wrapper">
      <div className="overlay">
        <div className="home-content text-center">
          <h1 className="mb-3 fw-bold text-white">Welcome to Hungry Boys 🍽️</h1>
          <p className="mb-3 text-white">
            Your one-stop destination to explore local restaurants, view delicious menus, and place your orders with ease.
          </p>
          <p className="mb-4 text-light" style={{ maxWidth: "600px" }}>
            Whether you're craving something spicy, sweet, or savory — we’ve got you covered.
          </p>
          <Link to="/restaurants" className="explore-btn">
            Start Exploring
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;

import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // External CSS for styling

function Home() {
  return (
    <div className="home-wrapper">
      <div className="overlay">
        <div className="home-content text-center">
          <h1 className="mb-3 fw-bold text-white">Welcome to Hungry Boys 🍽️</h1>
          <p className="mb-3 text-white fw-bold">
            Your one-stop destination to explore local restaurants, view delicious menus, and place your orders with ease.
          </p>
          <p className="mb-4 text-light fw-bold" style={{ maxWidth: "800px" }}>
            Your cravings, delivered—no matter where you are.<br />
            
            At Hungry Boys, we specialize in food delivery to even the remotest corners of campus life. Currently serving FAST CFD Campus, we’ve built a smart, batch-based delivery model that keeps costs low and satisfaction high. Whether you're buried in assignments or just don’t feel like stepping out, we’ve got your back—with your favorite meals just a few clicks away.<br />
            <br />
            More campuses coming soon. Stay hungry.
          </p>
          <Link to="/restaurants" className="explore-btn">
            Start Ordering
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;

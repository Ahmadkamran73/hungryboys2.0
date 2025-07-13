import React from 'react';
import { Link } from 'react-router-dom';
import { useUniversity } from '../context/UniversityContext';
import SlidingRibbon from "../components/SlidingRibbon";
import './Home.css'; // External CSS for styling

function Home() {
  const { selectedUniversity, selectedCampus } = useUniversity();

  return (
    <div className="home-wrapper">
      {/* <SlidingRibbon /> */}
      <div className="overlay">
        <div className="home-content text-center">
          <h1 className="mb-3 fw-bold text-white">Welcome to Hungry Boys 🍽️</h1>
          <p className="mb-3 text-white fw-bold">
            Your one-stop destination to explore local restaurants, view delicious menus, and place your orders with ease.
          </p>
          
          {selectedUniversity && selectedCampus ? (
            <div className="mb-4">
              <p className="text-light fw-bold mb-3">
                Currently serving: <span className="text-danger">{selectedUniversity.name} - {selectedCampus.name}</span>
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Link to="/restaurants" className="explore-btn">
                  View Restaurants
                </Link>
                <Link to="/mart-items" className="explore-btn">
                  View Mart Items
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <p className="text-light fw-bold justify-content-center" >
                Please select your university and campus to start exploring restaurants and mart items.
              </p>
              <p className="text-danger fw-bold">
                Use the university selector in the navigation bar to get started.
              </p>
            </div>
          )}
          
          <p className="mb-4 text-light fw-bold" style={{ maxWidth: "800px" }}>
            Your cravings, delivered—no matter where you are.<br />
            <br />
            At Hungry Boys, we specialize in food delivery to even the remotest corners of campus life. We've built a smart, batch-based delivery model that keeps costs low and satisfaction high. Whether you're buried in assignments or just don't feel like stepping out, we've got your back—with your favorite meals just a few clicks away.<br />
            <br />
            More campuses coming soon. Stay hungry.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;

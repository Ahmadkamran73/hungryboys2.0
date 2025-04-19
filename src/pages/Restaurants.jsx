import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import RestaurantCard from "../components/RestaurantCard";
import "../styles/Restaurants.css"; // 👈 linked external CSS

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);   // loading state
  const [error, setError] = useState(null);        // error state

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "restaurants"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setRestaurants(data);
      } catch (err) {
        console.error("Error fetching restaurants:", err);
        setError("Failed to fetch restaurants. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  if (loading) {
    return (
      <div className="restaurants-page d-flex justify-content-center align-items-center">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="restaurants-page text-center text-danger mt-5">
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div className="restaurants-page">
      <div className="container">
        <h1 className="text-center fw-bold mb-5 restaurants-title">
          Choose a Restaurant
        </h1>
        <div className="row g-4 justify-content-center">
          {restaurants.map(rest => (
            <div
              key={rest.id}
              className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
            >
              <RestaurantCard
                id={rest.id}
                name={rest.name}
                location={rest.location}
                cuisine={rest.cuisine}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Restaurants;

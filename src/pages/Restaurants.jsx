import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useUniversity } from "../context/UniversityContext";
import RestaurantCard from "../components/RestaurantCard";
import SearchBar from "../components/SearchBar";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/Restaurants.css";

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedUniversity, selectedCampus } = useUniversity();

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!selectedUniversity || !selectedCampus) {
        setRestaurants([]);
        setFilteredRestaurants([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch restaurants for the selected campus
        const restaurantsRef = collection(
          db, 
          "universities", 
          selectedUniversity.id, 
          "campuses", 
          selectedCampus.id, 
          "restaurants"
        );
        
        const querySnapshot = await getDocs(restaurantsRef);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRestaurants(data);
        setFilteredRestaurants(data);
      } catch (err) {
        const handledError = handleError(err, 'Restaurants - fetchRestaurants');
        setError(handledError.message);
        console.error("Error fetching restaurants:", handledError);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [selectedUniversity, selectedCampus]);

  // Filter restaurants based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRestaurants(restaurants);
    } else {
      const filtered = restaurants.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRestaurants(filtered);
    }
  }, [searchTerm, restaurants]);

  // Show message if no university/campus is selected
  if (!selectedUniversity || !selectedCampus) {
    return (
      <div className="restaurants-page">
        <div className="container">
          <div className="text-center mt-5">
            <h3 className="text-muted">
              {!selectedUniversity 
                ? "Please select a university and campus to view restaurants"
                : "Please select a campus to view restaurants"
              }
            </h3>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="restaurants-page">
        <LoadingSpinner message="Loading Restaurants..." />
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
          Restaurants at {selectedCampus.name}
        </h1>
        <div className="text-center mb-4">
          <p className="text-muted">
            {selectedUniversity.name} - {selectedCampus.name}
          </p>
        </div>
        
        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search restaurants by name, cuisine, or location..."
        />
        
        {filteredRestaurants.length === 0 ? (
          <div className="text-center mt-5">
            {searchTerm ? (
              <>
                <h4 className="text-muted">No restaurants found matching "{searchTerm}"</h4>
                <p className="text-muted">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <h4 className="text-muted">No restaurants available at this campus</h4>
                <p className="text-muted">Check back later for new restaurants!</p>
              </>
            )}
          </div>
        ) : (
          <div className="row g-4 justify-content-center">
            {filteredRestaurants.map(rest => (
              <div
                key={rest.id}
                className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
              >
                <RestaurantCard
                  id={rest.id}
                  name={rest.name}
                  location={rest.location}
                  cuisine={rest.cuisine}
                  openTime={rest.openTime}
                  closeTime={rest.closeTime}
                  is24x7={rest.is24x7}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Restaurants;

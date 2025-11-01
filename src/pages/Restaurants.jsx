import React, { useEffect, useState } from "react";
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
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
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
        
        // Fetch restaurants from MongoDB API
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/restaurants?campusId=${selectedCampus.id}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        
        const data = await response.json();
        // Normalize possible legacy image keys -> photoURL
        const normalized = (Array.isArray(data) ? data : []).map(r => ({
          ...r,
          photoURL: r.photoURL || r.imageUrl || r.photoUrl || r.imageURL || null,
        }));
        console.log('Restaurants fetched and normalized:', normalized);
        setRestaurants(normalized);
        setFilteredRestaurants(normalized);
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

  // Get unique cuisines for filtering
  const cuisines = ["All", ...new Set(restaurants.map(r => r.cuisine).filter(Boolean))];

  // Filter and sort restaurants
  useEffect(() => {
    let filtered = [...restaurants];

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(restaurant =>
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Cuisine filter
    if (selectedCuisine !== "All") {
      filtered = filtered.filter(r => r.cuisine === selectedCuisine);
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "cuisine") {
        return (a.cuisine || "").localeCompare(b.cuisine || "");
      }
      return 0;
    });

    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants, selectedCuisine, sortBy]);

  if (!selectedUniversity || !selectedCampus) {
    return (
      <div className="restaurants-page">
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <h2>Select Your Location</h2>
          <p>Please select a university and campus from the navigation bar to view available restaurants</p>
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
      <div className="restaurants-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="restaurants-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="header-content">
            <div className="header-text">
              <h1 className="page-title">Discover Restaurants</h1>
              <p className="page-subtitle">
                <span className="location-badge">
                  📍 {selectedUniversity.name} - {selectedCampus.name}
                </span>
              </p>
              <p className="restaurants-count">
                {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Controls Section - Match MartItems Structure */}
        <div className="mart-controls">
          <div className="mart-controls-left">
            {/* Search Bar */}
            <div className="mart-search-wrapper">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search restaurants, cuisines, or locations..."
              />
            </div>
          </div>

          <div className="mart-controls-right">
            {/* Sort Dropdown */}
            <select
              className="mart-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="cuisine">Sort by Cuisine</option>
            </select>

            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Cuisine Filter Chips - Match MartItems Categories */}
        {cuisines.length > 1 && (
          <div className="mart-categories">
            {cuisines.map((cuisine) => (
              <button
                key={cuisine}
                className={`mart-category-chip ${selectedCuisine === cuisine ? 'active' : ''}`}
                onClick={() => setSelectedCuisine(cuisine)}
              >
                {cuisine}
              </button>
            ))}
          </div>
        )}

        {/* Results Info */}
        <div className="mart-results-info">
          <span className="results-count">
            {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} available
          </span>
        </div>

        {/* Restaurants Grid/List */}
        {filteredRestaurants.length === 0 ? (
          <div className="empty-results">
            <div className="empty-icon">🔍</div>
            <h3>No restaurants found</h3>
            {searchTerm || selectedCuisine !== "All" ? (
              <p>Try adjusting your filters or search terms</p>
            ) : (
              <p>No restaurants available at this campus yet. Check back soon!</p>
            )}
            {(searchTerm || selectedCuisine !== "All") && (
              <button
                className="reset-btn"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCuisine("All");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className={`restaurants-container ${viewMode}-view`}>
            {filteredRestaurants.map(rest => (
              <div key={rest.id} className="restaurant-wrapper">
                <RestaurantCard
                  id={rest.id}
                  name={rest.name}
                  location={rest.location}
                  cuisine={rest.cuisine}
                  openTime={rest.openTime}
                  closeTime={rest.closeTime}
                  is24x7={rest.is24x7}
                  photoURL={rest.photoURL}
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

import React, { useEffect, useState } from "react";
import { useUniversity } from "../context/UniversityContext";
import MartItemCard from "../components/MartItemCard";
import SearchBar from "../components/SearchBar";
import FloatingCartButton from "../components/FloatingCartButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/MartItems.css";

const MartItems = () => {
  const [martItems, setMartItems] = useState([]);
  const [filteredMartItems, setFilteredMartItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStock, setSelectedStock] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedUniversity, selectedCampus } = useUniversity();

  useEffect(() => {
    const fetchMartItems = async () => {
      if (!selectedUniversity || !selectedCampus) {
        setMartItems([]);
        setFilteredMartItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Fetch mart items from MongoDB API
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/mart-items?campusId=${selectedCampus.id}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch mart items');
        }
        
        const data = await response.json();
        setMartItems(data);
        setFilteredMartItems(data);
      } catch (err) {
        const handledError = handleError(err, 'MartItems - fetchMartItems');
        setError(handledError.message);
        console.error("Error fetching mart items:", handledError);
      } finally {
        setLoading(false);
      }
    };

    fetchMartItems();
  }, [selectedUniversity, selectedCampus]);

  // Get unique categories
  const categories = ["All", ...new Set(martItems.map(item => item.category).filter(Boolean))];

  // Filter and sort mart items
  useEffect(() => {
    let filtered = [...martItems];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by stock
    if (selectedStock === "In Stock") {
      filtered = filtered.filter(item => item.stock > 0);
    } else if (selectedStock === "Out of Stock") {
      filtered = filtered.filter(item => item.stock === 0);
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "stock":
          return (b.stock || 0) - (a.stock || 0);
        default:
          return 0;
      }
    });

    setFilteredMartItems(filtered);
  }, [searchTerm, martItems, selectedCategory, selectedStock, sortBy]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedStock("All");
    setSortBy("name");
  };

  // Show message if no university/campus is selected
  if (!selectedUniversity || !selectedCampus) {
    return (
      <div className="mart-page">
        <div className="mart-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <h3>
            {!selectedUniversity 
              ? "Please select a university and campus to view mart items"
              : "Please select a campus to view mart items"
            }
          </h3>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mart-page">
        <LoadingSpinner message="Loading Mart Items..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mart-page">
        <div className="mart-error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3>{error}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="mart-page">
      {/* Page Header */}
      <div className="mart-header">
        <div className="mart-header-content">
          <div className="mart-header-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Campus Mart</span>
          </div>
          <h1 className="mart-header-title">Shop at {selectedCampus.name}</h1>
          <p className="mart-header-subtitle">
            {selectedUniversity.name} • Daily Essentials & Snacks
          </p>
        </div>
      </div>

      <div className="mart-container">
        {/* Controls Section */}
        <div className="mart-controls">
          <div className="mart-controls-left">
            {/* Search Bar */}
            <div className="mart-search-wrapper">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Search products..."
              />
            </div>
          </div>

          <div className="mart-controls-right">
            {/* Stock Filter */}
            <select
              className="mart-select"
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
            >
              <option value="All">All Items</option>
              <option value="In Stock">In Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            {/* Sort Dropdown */}
            <select
              className="mart-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="stock">Stock Level</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips - Commented out for future use */}
        {/* {categories.length > 1 && (
          <div className="mart-categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`mart-category-chip ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )} */}

        {/* Results Info */}
        <div className="mart-results-info">
          <span className="results-count">
            {filteredMartItems.length} {filteredMartItems.length === 1 ? 'item' : 'items'} found
          </span>
          {(searchTerm || selectedCategory !== "All" || selectedStock !== "All" || sortBy !== "name") && (
            <button className="clear-filters-btn" onClick={handleClearFilters}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Mart Items Grid */}
        {filteredMartItems.length === 0 ? (
          <div className="mart-empty-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {searchTerm || selectedCategory !== "All" || selectedStock !== "All" ? (
              <>
                <h3>No items found</h3>
                <p>Try adjusting your search or filters</p>
                <button className="reset-btn" onClick={handleClearFilters}>
                  Reset All Filters
                </button>
              </>
            ) : (
              <>
                <h3>No mart items available</h3>
                <p>Check back later for new items!</p>
              </>
            )}
          </div>
        ) : (
          <div className="mart-items-grid">
            {filteredMartItems.map(item => (
              <MartItemCard
                key={item.id}
                name={item.name}
                price={item.price}
                description={item.description}
                category={item.category}
                stock={item.stock}
                photoURL={item.photoURL}
                campusId={selectedCampus?.id}
              />
            ))}
          </div>
        )}
      </div>
      
      <FloatingCartButton />
    </div>
  );
};

export default MartItems; 
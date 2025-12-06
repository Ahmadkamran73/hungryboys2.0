import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../utils/api";
import { useUniversity } from "../context/UniversityContext";
import MenuItemCard from "../components/MenuItemCard";
import SearchBar from "../components/SearchBar";
import FloatingCartButton from "../components/FloatingCartButton";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/MenuPage.css";

const MenuPage = () => {
  const { restaurantId } = useParams();
  const { selectedUniversity, selectedCampus } = useUniversity();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantData, setRestaurantData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuAndRestaurant = async () => {
      if (!selectedUniversity || !selectedCampus || !restaurantId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch restaurants via API and find the one by id
        const restResp = await api.get('/api/restaurants', { params: { campusId: selectedCampus.id } });
        const restList = restResp.data || [];
        const rest = restList.find(r => String(r.id) === String(restaurantId));
        if (!rest) {
          setError("Restaurant not found at this campus.");
          setLoading(false);
          return;
        }
        setRestaurantName(rest.name || 'Unknown Restaurant');
        setRestaurantData(rest);

        // Fetch menu items via API
        const itemsResp = await api.get('/api/menu-items', { params: { restaurantId } });
        const data = (itemsResp.data || []).map(d => ({
          id: d.id,
          name: d.name,
          price: d.price,
          photoURL: d.photoURL,
          description: d.description
        }));
        setMenuItems(data);
        setFilteredItems(data);
      } catch (err) {
        const handledError = handleError(err, 'MenuPage - fetchMenuAndRestaurant');
        setError(handledError.message);
        console.error("Error fetching data:", handledError);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAndRestaurant();
  }, [restaurantId, selectedUniversity, selectedCampus]);

  useEffect(() => {
    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  // Show message if no university/campus is selected
  if (!selectedUniversity || !selectedCampus) {
    return (
      <div className="menu-page">
        <div className="container">
          <div className="text-center mt-5">
            <h3 className="text-muted">
              {!selectedUniversity 
                ? "Please select a university and campus to view menu"
                : "Please select a campus to view menu"
              }
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="container">
        <h1 className="text-center menu-heading">
          {restaurantName ? `Explore ${restaurantName}'s Menu` : "Explore Our Menu"}
        </h1>
        
        {selectedUniversity && selectedCampus && (
          <div className="text-center mb-4">
            <p className="text-muted">
              {selectedUniversity.name} - {selectedCampus.name}
            </p>
          </div>
        )}

        {/* Search Bar */}
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder="Search menu items by name or description..."
        />

        {loading && (
          <div className="text-center my-5">
            <LoadingSpinner message="Loading Menu..." />
          </div>
        )}

        {error && (
          <div className="alert alert-danger text-center my-4">{error}</div>
        )}

        {!loading && !error && (
          <>
            {filteredItems.length === 0 ? (
              <div className="empty-results">
                <div className="empty-icon">🔍</div>
                <h3>No menu items found</h3>
                {searchTerm ? (
                  <p>Try adjusting your search terms</p>
                ) : (
                  <p>No menu items available at this restaurant yet. Check back soon!</p>
                )}
                {searchTerm && (
                  <button
                    className="reset-btn"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
                gap: '2rem',
                padding: '0'
              }}>
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    style={{ width: '100%' }}
                  >
                    <MenuItemCard
                      name={item.name}
                      price={item.price}
                      restaurantName={restaurantName}
                      photoURL={item.photoURL}
                      description={item.description}
                      campusId={selectedCampus?.id}
                      restaurantId={restaurantData?.id}
                      openTime={restaurantData?.openTime}
                      closeTime={restaurantData?.closeTime}
                      is24x7={restaurantData?.is24x7}
                      restaurantCuisine={restaurantData?.cuisine}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FloatingCartButton />
    </div>
  );
};

export default MenuPage;

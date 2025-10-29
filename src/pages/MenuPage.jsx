import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
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

        // Fetch restaurant name from the campus-specific collection
        const restaurantRef = doc(
          db, 
          "universities", 
          selectedUniversity.id, 
          "campuses", 
          selectedCampus.id, 
          "restaurants", 
          restaurantId
        );
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          const restaurantData = restaurantSnap.data();
          setRestaurantName(restaurantData.name || "Unknown Restaurant");
          setRestaurantData(restaurantData);
        } else {
          setError("Restaurant not found at this campus.");
          setLoading(false);
          return;
        }

        // Fetch menu items from the restaurant's menuItems subcollection
        const menuItemsRef = collection(
          db, 
          "universities", 
          selectedUniversity.id, 
          "campuses", 
          selectedCampus.id, 
          "restaurants", 
          restaurantId, 
          "menuItems"
        );
        const querySnapshot = await getDocs(menuItemsRef);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
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
          <div className="row g-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="col-6 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
                >
                  <MenuItemCard
                    name={item.name}
                    price={item.price}
                    restaurantName={restaurantName}
                    photoURL={item.photoURL}
                    description={item.description}
                    campusId={selectedCampus?.id}
                    openTime={restaurantData?.openTime}
                    closeTime={restaurantData?.closeTime}
                    is24x7={restaurantData?.is24x7}
                  />
                </div>
              ))
            ) : (
              <div className="text-white text-center my-5">
                {searchTerm ? (
                  <>
                    <h4>No menu items found matching "{searchTerm}"</h4>
                    <p>Try adjusting your search terms</p>
                  </>
                ) : (
                  <h4>No menu items available</h4>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FloatingCartButton />
    </div>
  );
};

export default MenuPage;

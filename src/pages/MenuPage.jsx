import React, { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import MenuItemCard from "../components/MenuItemCard";
import FloatingCartButton from "../components/FloatingCartButton";
import "../styles/MenuPage.css";

const MenuPage = () => {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuAndRestaurant = async () => {
      try {
        setLoading(true);

        // Fetch restaurant name
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantSnap = await getDoc(restaurantRef);
        if (restaurantSnap.exists()) {
          const restaurantData = restaurantSnap.data();
          setRestaurantName(restaurantData.name || "Unknown Restaurant");
        }

        // Fetch menu items
        const querySnapshot = await getDocs(
          collection(db, "restaurants", restaurantId, "menuItems")
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenuItems(data);
        setFilteredItems(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) fetchMenuAndRestaurant();
  }, [restaurantId]);

  useEffect(() => {
    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, menuItems]);

  return (
    <div className="menu-page">
      <div className="container">
        <h1 className="text-center menu-heading">
          {restaurantName ? `Explore ${restaurantName}'s Menu` : "Explore Our Menu"}
        </h1>

        {/* 🔍 Search Bar */}
        <div className="row justify-content-center mb-4">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="text-center my-5">
            <div className="loader"></div>
            <p className="text-light mt-3">Loading menu items...</p>
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
                  className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
                >
                  <MenuItemCard
                    name={item.name}
                    price={item.price}
                    restaurantName={restaurantName}
                  />
                </div>
              ))
            ) : (
              <div className="text-white text-center my-5">
                No matching menu items found.
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

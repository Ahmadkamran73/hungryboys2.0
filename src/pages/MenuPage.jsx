import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import MenuItemCard from "../components/MenuItemCard";
import "../styles/MenuPage.css";

const MenuPage = () => {
  const { restaurantId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(
          collection(db, "restaurants", restaurantId, "menuItems")
        );
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenuItems(data);
        setError(null); // reset error if successful
      } catch (err) {
        console.error("Error fetching menu items:", err);
        setError("Failed to load menu. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (restaurantId) fetchMenu();
  }, [restaurantId]);

  return (
    <div className="menu-page">
      <div className="container">
        <h1 className="text-center menu-heading">Explore Our Menu</h1>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center my-5">
            <div className="loader"></div>
            <p className="text-light mt-3">Loading menu items...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger text-center my-4">{error}</div>
        )}

        {/* Menu Grid */}
        {!loading && !error && (
          <div className="row g-3">
            {menuItems.length > 0 ? (
              menuItems.map((item) => (
                <div
                  key={item.id}
                  className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex justify-content-center align-items-stretch"
                >
                  <MenuItemCard
                    name={item.name}
                    price={item.price}
                    description={item.description}
                  />
                </div>
              ))
            ) : (
              <div className="text-white text-center my-5">
                No menu items found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuPage;

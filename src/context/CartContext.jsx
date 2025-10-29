import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useNavigate } from "react-router-dom";
import { useUniversity } from "./UniversityContext";

// Create a context for the cart
const CartContext = createContext();

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// CartProvider component to provide cart context to children
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cartItems");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const { user, userData } = useAuth();
  const { selectedUniversity, selectedCampus } = useUniversity();

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add an item to the cart with authentication and campus check
  const addToCart = (item, restaurantName, itemCampusId = null, restaurantData = null) => {
    // Check if user is authenticated
    if (!user) {
      // Redirect to login page
      window.location.href = "/login";
      return;
    }

    // Check if user is trying to order from their own campus
    if (userData && userData.campusId && itemCampusId && userData.campusId !== itemCampusId) {
      alert("You can only order from your own campus. Please select items from your campus only.");
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (i) => i.name === item.name && i.restaurantName === restaurantName
      );
      if (existing) {
        return prev.map((i) =>
          i.name === item.name && i.restaurantName === restaurantName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      } else {
        return [
          ...prev,
          {
            name: item.name,
            price: item.price,
            quantity: 1,
            restaurantName: restaurantName,
            restaurantId: restaurantData?.restaurantId,
            campusId: itemCampusId || userData?.campusId,
            restaurantData: restaurantData,
          },
        ];
      }
    });
  };

  // Increment the quantity of an item in the cart
  const incrementItem = (name, restaurantName) => {
    // Check if user is authenticated
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        i.name === name && i.restaurantName === restaurantName
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );
  };

  // Decrement the quantity of an item in the cart
  const decrementItem = (name, restaurantName) => {
    // Check if user is authenticated
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCartItems((prev) => {
      return prev
        .map((i) => {
          if (i.name === name && i.restaurantName === restaurantName) {
            const newQuantity = i.quantity - 1;
            // If quantity becomes 0, return null to filter it out
            if (newQuantity <= 0) {
              return null;
            }
            return { ...i, quantity: newQuantity };
          }
          return i;
        })
        .filter(Boolean); // Remove null items (items with 0 quantity)
    });
  };

  // Remove an item from the cart
  const removeItem = (name, restaurantName) => {
    // Check if user is authenticated
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setCartItems((prev) =>
      prev.filter((i) => !(i.name === name && i.restaurantName === restaurantName))
    );
  };

  // Clear the entire cart
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cartItems");
  };

  // Get the total cost of the cart
  const getTotalCost = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        incrementItem,
        decrementItem,
        removeItem,
        clearCart,
        getTotalCost,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

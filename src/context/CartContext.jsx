import React, { createContext, useContext, useState, useEffect } from "react";

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

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  // Add an item to the cart
  const addToCart = (item, restaurantName) => {
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
          },
        ];
      }
    });
  };

  // Increment the quantity of an item in the cart
  const incrementItem = (name, restaurantName) => {
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
    setCartItems((prev) =>
      prev.map((i) =>
        i.name === name && i.restaurantName === restaurantName
          ? { ...i, quantity: Math.max(i.quantity - 1, 1) }
          : i
      )
    );
  };

  // Remove an item from the cart
  const removeItem = (name, restaurantName) => {
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

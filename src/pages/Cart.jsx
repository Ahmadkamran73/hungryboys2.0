import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import "../styles/Cart.css";

const Cart = () => {
  const { cartItems, incrementItem, decrementItem, removeItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Don't render cart if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="cart-page">
      <h2 className="cart-heading">Your Cart</h2>
      <CartSummary
        cartItems={cartItems}
        incrementItem={incrementItem}
        decrementItem={decrementItem}
        removeItem={removeItem}
      />
    </div>
  );
};

export default Cart;

import React from "react";
import CartSummary from "../components/CartSummary";
import { useCart } from "../context/CartContext";
import "../styles/Cart.css";

const Cart = () => {
  const { cartItems, incrementItem, decrementItem, removeItem } = useCart();

  return (
    <div className="cart-page container-fluid py-4">
      <h2 className="cart-heading text-center">Your Cart</h2>
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

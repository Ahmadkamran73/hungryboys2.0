import React from "react";
import { Link } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import "../styles/FloatingCartButton.css";

const FloatingCartButton = () => {
  return (
    <Link to="/cart" className="floating-cart-button">
      <FaShoppingCart size={24} />
    </Link>
  );
};

export default FloatingCartButton;

import React from "react";
import { useCart } from "../context/CartContext";
import "../styles/MenuItemCard.css";

const MenuItemCard = ({ name, price, restaurantName, photoURL, description, campusId }) => {
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();

  // Find the item using name + restaurantName combination
  const cartItem = cartItems.find(
    (item) => item.name === name && item.restaurantName === restaurantName
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="menu-card">
      {photoURL && (
        <div className="menu-image-container">
          <img 
            src={photoURL} 
            alt={name} 
            className="menu-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="menu-content">
        <h5 className="menu-title">{name}</h5>
        {description && (
          <p className="menu-description">{description}</p>
        )}
        <div className="menu-price">Rs {price}</div>

        <div className="menu-cart-section">
          {quantity > 0 ? (
            <>
              <button
                className="menu-counter-btn"
                onClick={() => decrementItem(name, restaurantName)}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                className="menu-counter-btn"
                onClick={() => incrementItem(name, restaurantName)}
              >
                +
              </button>
            </>
          ) : (
            <button
              className="menu-add-btn"
              onClick={() => addToCart({ name, price }, restaurantName, campusId)}
            >
              + Add to Bucket
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;

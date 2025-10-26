import React from "react";
import { useCart } from "../context/CartContext";
import { isRestaurantOpen, getNextOpeningTime } from "../utils/isRestaurantOpen";
import "../styles/MenuItemCard.css";

const MenuItemCard = ({ name, price, restaurantName, photoURL, description, campusId, restaurantId, openTime, closeTime, is24x7 }) => {
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();
  
  const isOpen = isRestaurantOpen({ openTime, closeTime, is24x7 });
  const nextOpeningTime = getNextOpeningTime({ openTime, closeTime, is24x7 });

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
          {!isOpen ? (
            <button
              className="menu-add-btn"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
              title={nextOpeningTime ? `Restaurant opens at ${nextOpeningTime}` : 'Restaurant is currently closed'}
            >
              Closed
            </button>
          ) : quantity > 0 ? (
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
              onClick={() => addToCart({ name, price }, restaurantName, campusId, { restaurantId, openTime, closeTime, is24x7 })}
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

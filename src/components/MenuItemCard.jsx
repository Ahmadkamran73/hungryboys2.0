import React from "react";
import { useCart } from "../context/CartContext";
import { isRestaurantOpen, getNextOpeningTime } from "../utils/isRestaurantOpen";
import "../styles/MenuItemCard.css";

const MenuItemCard = ({ name, price, restaurantName, photoURL, description, campusId, openTime, closeTime, is24x7 }) => {
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();
  
  const isOpen = isRestaurantOpen({ openTime, closeTime, is24x7 });
  const nextOpeningTime = getNextOpeningTime({ openTime, closeTime, is24x7 });

  // Find the item using name + restaurantName combination
  const cartItem = cartItems.find(
    (item) => item.name === name && item.restaurantName === restaurantName
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  // Generate a consistent color based on item name
  const getItemColor = (name) => {
    const colors = [
      { primary: '#FF6B6B', light: '#FFE5E5' },
      { primary: '#4ECDC4', light: '#E5F9F7' },
      { primary: '#45B7D1', light: '#E5F4F9' },
      { primary: '#FFA07A', light: '#FFF0E5' },
      { primary: '#98D8C8', light: '#E8F7F3' },
      { primary: '#F7DC6F', light: '#FEF9E5' },
      { primary: '#BB8FCE', light: '#F4EDFC' },
      { primary: '#85C1E2', light: '#E8F4FA' },
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  const itemColor = getItemColor(name);

  return (
    <div className="menu-item-card">
      {/* Image Section */}
      <div className="menu-item-image-wrapper">
        {photoURL ? (
          <img 
            src={photoURL} 
            alt={name} 
            className="menu-item-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = `linear-gradient(135deg, ${itemColor.light} 0%, ${itemColor.primary}30 100%)`;
            }}
          />
        ) : (
          <div 
            className="menu-item-placeholder"
            style={{ background: `linear-gradient(135deg, ${itemColor.light} 0%, ${itemColor.primary}30 100%)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2M7 2v20M17 2v20" />
              <path d="M21 12H3" />
            </svg>
          </div>
        )}
        
        {/* Price Badge */}
        <div className="menu-item-price-badge">
          <span className="price-amount">Rs {price}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="menu-item-content">
        <div className="menu-item-info">
          <h4 className="menu-item-name">{name}</h4>
          {description && (
            <p className="menu-item-description">{description}</p>
          )}
        </div>

        {/* Action Section */}
        <div className="menu-item-actions">
          {!isOpen ? (
            <button
              className="menu-item-btn disabled"
              disabled
              title={nextOpeningTime ? `Restaurant opens at ${nextOpeningTime}` : 'Restaurant is currently closed'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Closed</span>
            </button>
          ) : quantity > 0 ? (
            <div className="menu-item-counter">
              <button
                className="counter-btn decrement"
                onClick={() => decrementItem(name, restaurantName)}
                aria-label="Decrease quantity"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span className="counter-value">{quantity}</span>
              <button
                className="counter-btn increment"
                onClick={() => incrementItem(name, restaurantName)}
                aria-label="Increase quantity"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="menu-item-btn add"
              onClick={() => addToCart({ name, price }, restaurantName, campusId, { openTime, closeTime, is24x7 })}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Add to Cart</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;


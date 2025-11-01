import React from "react";
import { useCart } from "../context/CartContext";
import "../styles/MartItemCard.css";

const MartItemCard = ({ name, price, description, category, stock, photoURL, campusId }) => {
  const { addToCart, cartItems, incrementItem, decrementItem } = useCart();

  // Find the item using name + "Mart" combination (since mart items don't have restaurant names)
  const cartItem = cartItems.find(
    (item) => item.name === name && item.restaurantName === "Mart"
  );
  const quantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (stock > 0) {
      addToCart(
        {
          name: name,
          price: price,
        },
        "Mart", // Use "Mart" as the restaurant name for mart items
        campusId
      );
    }
  };

  // Generate a consistent color based on category
  const getCategoryColor = (category) => {
    const colors = {
      'Snacks': { primary: '#FF6B6B', light: '#FFE5E5' },
      'Beverages': { primary: '#4ECDC4', light: '#E5F9F7' },
      'Dairy': { primary: '#F7DC6F', light: '#FEF9E5' },
      'Groceries': { primary: '#98D8C8', light: '#E8F7F3' },
      'Personal Care': { primary: '#BB8FCE', light: '#F4EDFC' },
      'Stationery': { primary: '#85C1E2', light: '#E8F4FA' },
      'default': { primary: '#45B7D1', light: '#E5F4F9' }
    };
    return colors[category] || colors.default;
  };

  const categoryColor = getCategoryColor(category);

  return (
    <div className="mart-product-card">
      {/* Image Section */}
      <div className="mart-product-image-wrapper">
        {photoURL ? (
          <img 
            src={photoURL} 
            alt={name} 
            className="mart-product-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.style.background = `linear-gradient(135deg, ${categoryColor.light} 0%, ${categoryColor.primary}30 100%)`;
            }}
          />
        ) : (
          <div 
            className="mart-product-placeholder"
            style={{ background: `linear-gradient(135deg, ${categoryColor.light} 0%, ${categoryColor.primary}30 100%)` }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
        )}
        
        {/* Stock Badge */}
        {stock !== undefined && (
          <div className={`mart-stock-badge ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
            {stock > 0 ? (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{stock} in stock</span>
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>Out of stock</span>
              </>
            )}
          </div>
        )}

      </div>

      {/* Content Section */}
      <div className="mart-product-content">
        <div className="mart-product-info">
          {/* Category Badge */}
          <div 
            className="mart-category-badge"
            style={{ 
              background: categoryColor.light,
              color: categoryColor.primary 
            }}
          >
            {category}
          </div>

          <h4 className="mart-product-name">{name}</h4>
          {description && (
            <p className="mart-product-description">{description}</p>
          )}
        </div>

        {/* Price placed at the bottom of the content */}
        <div className="mart-product-price">
          <span className="price-amount">Rs {price}</span>
        </div>

        {/* Action Section */}
        <div className="mart-product-actions">
          {stock <= 0 ? (
            <button
              className="mart-product-btn disabled"
              disabled
              title="This item is currently out of stock"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>Out of Stock</span>
            </button>
          ) : quantity > 0 ? (
            <div className="mart-product-counter">
              <button
                className="counter-btn decrement"
                onClick={() => decrementItem(name, "Mart")}
                aria-label="Decrease quantity"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <span className="counter-value">{quantity}</span>
              <button
                className="counter-btn increment"
                onClick={() => incrementItem(name, "Mart")}
                disabled={quantity >= stock}
                aria-label="Increase quantity"
                title={quantity >= stock ? `Maximum stock available: ${stock}` : ''}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              className="mart-product-btn add"
              onClick={handleAddToCart}
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

export default MartItemCard; 
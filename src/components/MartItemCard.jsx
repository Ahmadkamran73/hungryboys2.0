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

  return (
    <div className="mart-item-card">
      {photoURL && (
        <div className="mart-item-image-container">
          <img 
            src={photoURL} 
            alt={name} 
            className="mart-item-image"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
      )}
      <div className="mart-item-content">
        <h5 className="mart-item-title">{name}</h5>
        {description && (
          <p className="mart-item-description">{description}</p>
        )}
        <div className="mart-item-category">
          <small className="text-muted">Category: {category}</small>
        </div>
        <div className="mart-item-price">₹{price}</div>
        {stock !== undefined && (
          <div className="mart-item-stock">
            <small className={`text-${stock > 0 ? 'success' : 'danger'}`}>
              {stock > 0 ? `In Stock: ${stock}` : 'Out of Stock'}
            </small>
          </div>
        )}

        <div className="mart-item-cart-section">
          {quantity > 0 ? (
            <>
              <button
                className="mart-item-counter-btn"
                onClick={() => decrementItem(name, "Mart")}
                disabled={stock <= 0}
              >
                -
              </button>
              <span>{quantity}</span>
              <button
                className="mart-item-counter-btn"
                onClick={() => incrementItem(name, "Mart")}
                disabled={stock <= 0 || (stock > 0 && quantity >= stock)}
              >
                +
              </button>
            </>
          ) : (
            <button
              className="mart-item-add-btn"
              onClick={handleAddToCart}
              disabled={stock <= 0}
            >
              {stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MartItemCard; 
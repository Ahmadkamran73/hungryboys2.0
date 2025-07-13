import React from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom"; // ✅ for navigation
import "../styles/CartSummary.css";

const CartSummary = () => {
  const { cartItems, incrementItem, decrementItem, removeItem } = useCart();
  const navigate = useNavigate();

  // Calculate the total cost
  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Handle checkout button click
  const handleCheckout = () => {
    if (cartItems.length === 0) return; // Don't proceed if cart is empty
    navigate("/checkout"); // Navigate to the Checkout page
  };

  return (
    <div className="bg-dark text-white p-4 rounded shadow mb-4">
      <h4 className="text-danger mb-3">Your Bucket</h4>

      {cartItems.length === 0 ? (
        <p>Your bucket is empty.</p>
      ) : (
        <div>
          {cartItems.map((item, index) => (
            <div
              key={index}
              className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2"
            >
              <div>
                <strong>{item.name}</strong>
                <div className="text-muted small">
                  <span className="text-white">
                    {item.restaurantName === "Mart" ? "Mart" : `Restaurant: ${item.restaurantName}`}
                  </span><br />
                  <span className="text-white">Single Price: Rs {item.price}</span><br />
                  <span className="text-white">Total Price: Rs {item.price * item.quantity}</span>
                </div>
              </div>
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-light btn-sm me-2"
                  onClick={() => decrementItem(item.name, item.restaurantName)} // Pass name and restaurantName
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  className="btn btn-light btn-sm mx-2"
                  onClick={() => incrementItem(item.name, item.restaurantName)} // Pass name and restaurantName
                >
                  +
                </button>
                <button
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeItem(item.name, item.restaurantName)} // Pass name and restaurantName
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="mt-3">
            <h5>
              Total: <span className="text-success">Rs {total.toFixed(2)}</span>
            </h5>
            <button className="btn btn-danger mt-3 w-100" onClick={handleCheckout}>
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartSummary;

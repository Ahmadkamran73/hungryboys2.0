import React, { useState } from "react";
import { useCart } from "../context/CartContext"; // adjust path if needed
import axios from "axios";
import "../styles/CheckOutForm.css";

const CheckOutForm = () => {
  const { cartItems, clearCart, getTotalCost } = useCart();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    room: "",
    phone: "",
    email: "",
    persons: 1,
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "persons" ? Math.max(1, +value) : value,
    }));
  };

  const isEmailValid = (email) => {
    return email.endsWith("@cfd.nu.edu.pk");
  };

  const deliveryCharge = form.persons * 100;
  const itemTotal = getTotalCost();
  const grandTotal = itemTotal + deliveryCharge;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-PK", {
      timeZone: "Asia/Karachi",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCartItems = (items) => {
    const grouped = {};

    items.forEach(({ name, price, quantity, restaurantName }) => {
      if (!grouped[restaurantName]) grouped[restaurantName] = [];
      grouped[restaurantName].push(`${name} (x${quantity}) - Rs ${price * quantity}`);
    });

    let result = "";
    for (const [restaurant, orders] of Object.entries(grouped)) {
      result += `📍 ${restaurant}:\n  - ${orders.join("\n  - ")}\n\n`;
    }

    return result.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, phone, email, persons } = form;

    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items before placing an order.");
      return;
    }

    if (!firstName || !lastName || !phone || !email) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Email must end with @cfd.nu.edu.pk");
      return;
    }

    setError("");
    setLoading(true);

    const order = {
      ...form,
      itemTotal,
      deliveryCharge,
      grandTotal,
      cartItems: formatCartItems(cartItems),
      timestamp: formatDate(new Date().toISOString()),
    };

    try {
      const response = await axios.post(
        "https://api.sheetbest.com/sheets/331e3d27-550f-4864-94a7-da2206d271d0",
        order
      );
      console.log("Order submitted successfully:", response.data);
      clearCart();
      setSubmitted(true);
    } catch (err) {
      console.error("Error sending to Google Sheet:", err.response || err);
      setError("Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="checkout-container text-center text-white">
        <h2>Thank you for shopping! 🎉</h2>
        <p>Your order has been placed successfully.</p>
      </div>
    );
  }

  return (
    <div className="checkout-container container-fluid py-4">
      <h2 className="text-center text-white mb-4">🧾 Checkout</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {cartItems.length === 0 && (
        <div className="alert alert-warning">
          Your cart is empty. Add some items before checking out.
        </div>
      )}

      <form onSubmit={handleSubmit} className="row g-3 text-white">
        <div className="col-md-6">
          <label className="form-label">First Name *</label>
          <input
            type="text"
            className="form-control dark-input"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input
            type="text"
            className="form-control dark-input"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Hostel Room Number</label>
          <input
            type="text"
            className="form-control dark-input"
            placeholder="Hall Name - Room no"
            name="room"
            value={form.room}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number *</label>
          <input
            type="tel"
            className="form-control dark-input"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="col-12">
          <label className="form-label">Email Address (@  edu only) *</label>
          <input
            type="email"
            className="form-control dark-input"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label">Number of Persons *</label>
          <div className="input-group">
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => setForm(prev => ({ ...prev, persons: Math.max(1, prev.persons - 1) }))}
            >
              −
            </button>
            <input
              type="number"
              className="form-control text-center dark-input"
              name="persons"
              value={form.persons}
              onChange={handleChange}
              min="1"
              required
            />
            <button
              className="btn btn-danger"
              type="button"
              onClick={() => setForm(prev => ({ ...prev, persons: prev.persons + 1 }))}
            >
              +
            </button>
          </div>
          <small className="text">Each delivery is Rs 100 per person</small>
        </div>



        <div className="col-12 mt-4">
          <h5 className="text-light">Order Summary</h5>
          <ul className="list-group bg-dark text-white">
            <li className="list-group-item bg-dark text-white">
              Item Total: Rs {itemTotal}
            </li>
            <li className="list-group-item bg-dark text-white">
              Delivery: Rs {deliveryCharge} ({form.persons} persons)
            </li>
            <li className="list-group-item bg-dark text-white fw-bold">
              Grand Total: Rs {grandTotal}
            </li>
          </ul>
        </div>

        <div className="col-12 text-center">
          <button
            type="submit"
            className="btn btn-danger px-4 py-2 mt-3"
            disabled={loading || cartItems.length === 0}
          >
            {loading ? "Processing..." : "Checkout"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckOutForm;

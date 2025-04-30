import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import axios from "axios";
import imageCompression from "browser-image-compression";
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
    paymentMethod: "",
    accountTitle: "",
    bankName: "",
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotURL, setScreenshotURL] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "persons" ? Math.max(1, +value) : value,
    }));
  };

  const isEmailValid = (email) => email.endsWith("@cfd.nu.edu.pk");

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
    return Object.entries(grouped)
      .map(
        ([restaurant, orders]) => `📍 ${restaurant}:\n  - ${orders.join("\n  - ")}`
      )
      .join("\n\n");
  };

  const handleImageUpload = async (file) => {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
    });

    const data = new FormData();
    data.append("file", compressedFile);
    data.append("upload_preset", uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });

    const cloudData = await res.json();
    return cloudData.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      firstName,
      lastName,
      phone,
      email,
      paymentMethod,
      accountTitle,
      bankName,
    } = form;

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!firstName || !lastName || !phone || !email || !paymentMethod) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Email must end with @cfd.nu.edu.pk");
      return;
    }

    if (paymentMethod === "Online Payment") {
      if (!screenshotFile || !accountTitle || !bankName) {
        setError("Please complete all online payment fields.");
        return;
      }
    }

    setError("");
    setLoading(true);

    let uploadedURL = "";
    if (paymentMethod === "Online Payment" && screenshotFile) {
      try {
        uploadedURL = await handleImageUpload(screenshotFile);
        setScreenshotURL(uploadedURL);
      } catch (err) {
        setError("Screenshot upload failed. Try again.");
        setLoading(false);
        return;
      }
    }

    const order = {
      ...form,
      itemTotal,
      deliveryCharge,
      grandTotal,
      screenshotURL: uploadedURL,
      cartItems: formatCartItems(cartItems),
      timestamp: formatDate(new Date().toISOString()),
    };

    try {
      await axios.post("https://api.sheetbest.com/sheets/331e3d27-550f-4864-94a7-da2206d271d0", order);
      clearCart();
      setSubmitted(true);
    } catch (err) {
      setError("Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="checkout-container text-center text-white">
        <h2>Thank you for shopping! 🎉</h2>
        <p>Your order has been placed successfully.</p>
  
        <Link to="/restaurants" className="btn btn-danger mt-3">
          Start Ordering
        </Link>
      </div>
    );
  }
  return (
    <div className="checkout-container container-fluid py-4">
      <h2 className="text-center text-white mb-4">🧾 Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit} className="row g-3 text-white">
        {/* Basic Info */}
        <div className="col-md-6">
          <label className="form-label">First Name *</label>
          <input type="text" className="form-control dark-input" name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input type="text" className="form-control dark-input" name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Hostel Room Number</label>
          <input type="text" className="form-control dark-input" name="room" placeholder="Hall Name - Room no" value={form.room} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone Number *</label>
          <input type="tel" className="form-control dark-input" name="phone" value={form.phone} onChange={handleChange} required />
        </div>
        <div className="col-12">
          <label className="form-label">Email Address (@cfd.nu.edu.pk) *</label>
          <input type="email" className="form-control dark-input" name="email" value={form.email} onChange={handleChange} required />
        </div>

        {/* Persons */}
        <div className="col-12">
          <label className="form-label">Number of Persons *</label>
          <div className="input-group">
            <button type="button" className="btn btn-danger" onClick={() => setForm(prev => ({ ...prev, persons: Math.max(1, prev.persons - 1) }))}>−</button>
            <input type="number" className="form-control text-center dark-input" name="persons" value={form.persons} onChange={handleChange} min="1" required />
            <button type="button" className="btn btn-danger" onClick={() => setForm(prev => ({ ...prev, persons: prev.persons + 1 }))}>+</button>
          </div>
          <small className="text">Each delivery is Rs 100 per person</small>
        </div>

        {/* Payment Method */}
        <div className="col-12">
          <label className="form-label">Payment Method *</label><br />
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="paymentMethod" value="Cash on Delivery"
              checked={form.paymentMethod === "Cash on Delivery"} onChange={handleChange} required />
            <label className="form-check-label">Cash on Delivery</label>
          </div>
          <div className="form-check form-check-inline">
            <input className="form-check-input" type="radio" name="paymentMethod" value="Online Payment"
              checked={form.paymentMethod === "Online Payment"} onChange={handleChange} required />
            <label className="form-check-label">Online Payment</label>
          </div>
        </div>

        {/* Extra Fields for Online Payment */}
        {form.paymentMethod === "Online Payment" && (
          <>
            <div className="col-md-6">
              <label className="form-label">Account Title *</label>
              <input type="text" className="form-control dark-input" name="accountTitle" value={form.accountTitle} onChange={handleChange} required />
            </div>
            <div className="col-md-6">
              <label className="form-label">Bank Name *</label>
              <input type="text" className="form-control dark-input" name="bankName" value={form.bankName} onChange={handleChange} required />
            </div>
            <div className="col-12">
              <label className="form-label">Upload Screenshot *</label>
              <input type="file" accept="image/*" className="form-control dark-input" onChange={(e) => setScreenshotFile(e.target.files[0])} required />
            </div>
          </>
        )}

        {/* Order Summary */}
        <div className="col-12 mt-4">
          <h5 className="text-light">Order Summary</h5>
          <ul className="list-group bg-dark text-white">
            <li className="list-group-item bg-dark text-white">Item Total: Rs {itemTotal}</li>
            <li className="list-group-item bg-dark text-white">Delivery Charge: Rs {deliveryCharge}</li>
            <li className="list-group-item bg-dark text-white">Grand Total: Rs {grandTotal}</li>
          </ul>
        </div>

        {/* Submit */}
        <div className="col-12 text-center">
          <button type="submit" className="btn btn-danger px-4 py-2 mt-3" disabled={loading || cartItems.length === 0}>
            {loading ? "Processing..." : "Checkout"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CheckOutForm;

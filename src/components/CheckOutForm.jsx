import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useUniversity } from "../context/UniversityContext";
import { Link } from "react-router-dom";
import axios from "axios";
import imageCompression from "browser-image-compression";
import ReCAPTCHA from "react-google-recaptcha";
import { handleError } from "../utils/errorHandler";
import { submitOrderToSheet } from "../utils/googleSheets";
import { isRestaurantOpen, getNextOpeningTime } from "../utils/isRestaurantOpen";
import { getCampusSettings } from "../utils/campusSettings";
import "../styles/CheckOutForm.css";

const CheckOutForm = () => {
  const { cartItems, clearCart, getTotalCost } = useCart();
  const { user, userData } = useAuth();
  const { selectedUniversity, selectedCampus } = useUniversity();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    room: "",
    phone: "",
    email: "",
    gender: "male", // Default to male
    persons: 1,
    paymentMethod: "Online Payment",
    accountTitle: "",
    bankName: "",
    specialInstruction: "", // <-- NEW FIELD
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotURL, setScreenshotURL] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [campusSettings, setCampusSettings] = useState({
    deliveryChargePerPerson: 150,
    accountTitle: "Maratib Ali",
    bankName: "SadaPay",
    accountNumber: "03330374616"
  });

  // Auto-fill email, firstName, lastName when user is logged in
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      email: user?.email || prev.email,
      firstName: userData?.firstName || prev.firstName,
      lastName: userData?.lastName || prev.lastName,
    }));
  }, [user, userData]);

  // Fetch campus settings when campus is selected
  useEffect(() => {
    const loadCampusSettings = async () => {
      if (!selectedCampus?.id) return;
      
      try {
        const settings = await getCampusSettings(selectedCampus);
        setCampusSettings(settings);
      } catch (err) {
        console.warn('Failed to fetch campus settings, using defaults:', err);
        // Keep default settings if fetch fails
      }
    };

    loadCampusSettings();
  }, [selectedCampus]);

  // Refresh settings when component mounts (in case settings were updated)
  useEffect(() => {
    const refreshSettings = async () => {
      if (!selectedCampus?.id) return;
      
      try {
        const settings = await getCampusSettings(selectedCampus);
        setCampusSettings(settings);
      } catch (err) {
        console.warn('Failed to refresh campus settings:', err);
      }
    };

    // Refresh settings on component mount
    refreshSettings();
  }, []);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Phone number validation for Pakistani format: 0300-0000000
  const isPhoneValid = (phone) => {
    return /^03\d{2}-\d{7}$/.test(phone);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Auto-format phone number
    if (name === "phone") {
      // Remove all non-digits
      let digits = value.replace(/\D/g, "");
      if (digits.length > 11) digits = digits.slice(0, 11);
      let formatted = digits;
      if (digits.length > 4) {
        formatted = digits.slice(0, 4) + "-" + digits.slice(4);
      }
      setForm((prev) => ({ ...prev, phone: formatted }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      [name]: name === "persons" ? Math.max(1, +value) : value,
    }));
  };

  const isEmailValid = (email) => email.endsWith("@cfd.nu.edu.pk");

  const deliveryCharge = form.persons * campusSettings.deliveryChargePerPerson;
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
        ([restaurant, orders]) =>
          `📍 ${restaurant}:\n  - ${orders.join("\n  - ")}`
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

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: data,
      }
    );

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
      gender,
      accountTitle,
      bankName,
    } = form;

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!firstName || !lastName || !phone || !email || !gender) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isPhoneValid(phone)) {
      setError("Phone number must be in Pakistani format: 0300-0000000");
      return;
    }

    if (!isEmailValid(email)) {
      setError("Email must end with @cfd.nu.edu.pk");
      return;
    }

    // Check if university and campus are selected
    if (!selectedUniversity || !selectedCampus) {
      setError("Please select your university and campus from the navigation bar.");
      return;
    }

    if (!screenshotFile || !accountTitle || !bankName) {
      setError("Please complete all online payment fields.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    setError("");
    setLoading(true);

    let uploadedURL = "";
    try {
      uploadedURL = await handleImageUpload(screenshotFile);
      setScreenshotURL(uploadedURL);
    } catch (err) {
      const handledError = handleError(err, 'CheckOutForm - imageUpload');
      setError(handledError.message);
      setLoading(false);
      return;
    }

    const order = {
      ...form,
      itemTotal,
      deliveryCharge,
      grandTotal,
      screenshotURL: uploadedURL,
      cartItems: formatCartItems(cartItems),
      timestamp: formatDate(new Date().toISOString()),
      recaptchaToken,
    };

    try {
      // Check if any restaurants in the cart are closed
      const closedRestaurants = [];
      for (const item of cartItems) {
        if (item.restaurantData && !isRestaurantOpen(item.restaurantData)) {
          const nextOpeningTime = getNextOpeningTime(item.restaurantData);
          closedRestaurants.push({
            name: item.restaurantName,
            nextOpeningTime: nextOpeningTime
          });
        }
      }

      if (closedRestaurants.length > 0) {
        const closedRestaurant = closedRestaurants[0]; // Show first closed restaurant
        const message = closedRestaurant.nextOpeningTime 
          ? `Sorry, ${closedRestaurant.name} is currently closed. Please order after ${closedRestaurant.nextOpeningTime}.`
          : `Sorry, ${closedRestaurant.name} is currently closed.`;
        
        setError(message);
        setLoading(false);
        return;
      }

      // Submit to Google Sheets
      await submitOrderToSheet(order, selectedUniversity.name, selectedCampus.name);
      
      // Also submit to backend API for backup/notification purposes
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
        await axios.post(`${backendUrl}/submit-order`, order);
      } catch (apiError) {
        console.warn('Backend API submission failed, but order was saved to Google Sheets:', apiError);
      }
      
      clearCart();
      setSubmitted(true);
    } catch (err) {
      const handledError = handleError(err, 'CheckOutForm - submitOrder');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="checkout-container text-center text-white">
        <h2>Thank you for shopping! 🎉</h2>
        <p>Your order has been placed successfully.</p>
        <Link to="/restaurants" className="btn btn-danger mt-3">Start Ordering</Link>
      </div>
    );
  }

  return (
    <div className="checkout-container container-fluid py-4">
      <h2 className="text-center text-white mb-4">🧾 Checkout</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      
      {loading && (
        <div className="text-center mb-4">
          <p className="text-white">Processing...</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="row g-3 text-white">

        {/* Basic Info */}
        <div className="col-md-6">
          <label className="form-label">First Name *</label>
          <input type="text" className="form-control dark-input" name="firstName" value={form.firstName} onChange={handleChange} required autoComplete="given-name" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input type="text" className="form-control dark-input" name="lastName" value={form.lastName} onChange={handleChange} required autoComplete="family-name" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Hostel Room Number</label>
          <input type="text" className="form-control dark-input" name="room" placeholder="Hall Name - Room no" value={form.room} onChange={handleChange} />
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
            pattern="03[0-9]{2}-[0-9]{7}"
            maxLength={12}
            placeholder="0300-0000000"
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>
        <div className="col-12">
          <label className="form-label">Email Address (@cfd.nu.edu.pk) *</label>
          <input 
            type="email" 
            className="form-control dark-input" 
            name="email" 
            value={form.email} 
            readOnly 
            required 
          />
        </div>

        {/* Gender Selection */}
        <div className="col-12">
          <label className="form-label">Gender *</label>
          <div className="d-flex gap-4">
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="radio" 
                name="gender" 
                id="male" 
                value="male" 
                checked={form.gender === "male"} 
                onChange={handleChange}
                required
              />
              <label className="form-check-label text-white" htmlFor="male">
                Male
              </label>
            </div>
            <div className="form-check">
              <input 
                className="form-check-input" 
                type="radio" 
                name="gender" 
                id="female" 
                value="female" 
                checked={form.gender === "female"} 
                onChange={handleChange}
                required
              />
              <label className="form-check-label text-white" htmlFor="female">
                Female
              </label>
            </div>
          </div>
        </div>

        {/* Persons */}
        <div className="col-12">
          <label className="form-label">Number of Persons *</label>
          <div className="input-group">
            <button type="button" className="btn btn-danger" onClick={() => setForm(prev => ({ ...prev, persons: Math.max(1, prev.persons - 1) }))}>−</button>
            <input type="number" className="form-control text-center dark-input" name="persons" value={form.persons} onChange={handleChange} min="1" required />
            <button type="button" className="btn btn-danger" onClick={() => setForm(prev => ({ ...prev, persons: prev.persons + 1 }))}>+</button>
          </div>
          <small className="text">Each delivery is Rs {campusSettings.deliveryChargePerPerson} per person</small>
        </div>

        {/* Special Instructions */}
        <div className="col-12">
          <label className="form-label">Special Instructions (Optional)</label>
          <textarea
            className="form-control dark-input"
            name="specialInstruction"
            placeholder="Any extra sauce, drinks, or requests?"
            value={form.specialInstruction}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>

        {/* Payment Instructions */}
        <input type="hidden" name="paymentMethod" value="Online Payment" />
        <div className="col-12 text-white border p-3 rounded" style={{ backgroundColor: "#222" }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <strong>Pay to:</strong>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-light"
              onClick={async () => {
                if (selectedCampus?.id) {
                  try {
                    const settings = await getCampusSettings(selectedCampus);
                    setCampusSettings(settings);
                  } catch (err) {
                    console.warn('Failed to refresh settings:', err);
                  }
                }
              }}
              title="Refresh payment details"
            >
              🔄 Refresh
            </button>
          </div>
          Account Title: {campusSettings.accountTitle}<br />
          Bank: {campusSettings.bankName}<br />
          Account Number: {campusSettings.accountNumber}
        </div>

        {/* Online Payment Info */}
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

        {/* Order Summary */}
        <div className="col-12 mt-4">
          <h5 className="text-light">Order Summary</h5>
          <ul className="list-group bg-dark text-white">
            <li className="list-group-item bg-dark text-white">Item Total: Rs {itemTotal}</li>
            <li className="list-group-item bg-dark text-white">Delivery Charge: Rs {deliveryCharge}</li>
            <li className="list-group-item bg-dark text-white">Grand Total: Rs {grandTotal}</li>
          </ul>
        </div>

        {/* CAPTCHA */}
        <div className="col-12 mt-3">
          <ReCAPTCHA
            sitekey={recaptchaSiteKey}
            onChange={(token) => setRecaptchaToken(token)}
          />
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

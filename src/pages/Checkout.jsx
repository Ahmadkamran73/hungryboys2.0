// src/pages/Checkout.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FloatingCartButton from "../components/FloatingCartButton";
import CheckOutForm from "../components/CheckOutForm";

function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Don't render checkout if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="checkout-page">
      <CheckOutForm />
      <FloatingCartButton />  
    </div>
  );
}

export default Checkout;

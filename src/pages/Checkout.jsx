// src/pages/Checkout.jsx
import React from "react";
import FloatingCartButton from "../components/FloatingCartButton";
import CheckOutForm from "../components/CheckOutForm";

function Checkout() {
  return (
    <div className="checkout-page">
      <CheckOutForm />
      <FloatingCartButton />  
    </div>
  );
}

export default Checkout;

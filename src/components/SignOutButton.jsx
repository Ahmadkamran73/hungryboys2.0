import React, { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { handleError } from "../utils/errorHandler";

function SignOutButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      // Clear cart from localStorage on logout
      localStorage.removeItem('cart');
      navigate("/login");
    } catch (err) {
      const handledError = handleError(err, 'SignOutButton - signOut');
      console.error("Error signing out:", handledError);
      // You could show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <button
        onClick={handleSignOut}
        className="btn btn-outline-danger"
        disabled={loading}
        style={{
          padding: "10px 30px",
          fontWeight: "bold",
          borderRadius: "8px",
          marginBottom: "10px",
          fontSize: "16px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        {loading ? "Signing Out..." : "Sign Out"}
      </button>
    </div>
  );
}

export default SignOutButton;

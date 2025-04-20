import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

function SignOutButton() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error("Error signing out:", err.message);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
      <button
        onClick={handleSignOut}
        className="btn btn-outline-danger"
        style={{
          padding: "10px 30px",
          fontWeight: "bold",
          borderRadius: "8px",
          marginBottom: "10px",
          fontSize: "16px",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        🚪 Sign Out
      </button>
    </div>
  );
}

export default SignOutButton;

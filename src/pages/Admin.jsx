// src/pages/Admin.jsx
import React from "react";
import SignOutButton from "../components/SignOutButton";
import AdminCRUD from "../components/AdminCRUD"; // Adjust path if needed

function Admin() {
  return (
    <div className="container mt-4">
      <AdminCRUD />
      <SignOutButton />
    </div>
  );
}

export default Admin;
  
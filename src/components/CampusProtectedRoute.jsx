import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CampusProtectedRoute = ({ children }) => {
  const { universityId, campusId } = useParams();
  const { user, userData, loading, canAccessCampus, isSuperAdmin } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || !userData) {
    return <Navigate to="/login" replace />;
  }

  // Super admins can access any campus
  if (isSuperAdmin()) {
    return children;
  }

  // Check if user can access this specific campus
  if (!canAccessCampus(universityId, campusId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default CampusProtectedRoute; 
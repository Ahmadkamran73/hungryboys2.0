import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Unauthorized.css";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="unauthorized-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <div className="unauthorized-card">
              <div className="unauthorized-icon"></div>
              <h1 className="unauthorized-title">Access Denied</h1>
              <p className="unauthorized-message">
                You don't have permission to access this page.
              </p>
              <p className="unauthorized-subtitle">
                Please contact your administrator if you believe this is an error.
              </p>
              <div className="unauthorized-actions">
                <button 
                  className="btn btn-primary me-3"
                  onClick={() => navigate("/home")}
                >
                  Go to Home
                </button>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized; 
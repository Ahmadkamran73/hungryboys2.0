import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api, authHeaders } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import RestaurantManagerOrdersPanel from "../components/RestaurantManagerOrdersPanel";
import { handleError } from "../utils/errorHandler";
import "../styles/CampusAdmin.css";

const RestaurantManager = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);

  useEffect(() => {
    if (userData?.restaurantId) {
      fetchRestaurantDetails();
    }
  }, [userData]);

  const fetchRestaurantDetails = async () => {
    setLoading(true);
    try {
      const headers = await authHeaders(user);
      const response = await api.get(`/api/restaurants/${userData.restaurantId}`, { headers });
      setRestaurant(response.data);
    } catch (err) {
      const handledError = handleError(err, 'RestaurantManager - fetchRestaurantDetails');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)' }}>
        <LoadingSpinner message="Loading restaurant details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="campus-admin-page">
        <div className="container mt-5">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="campus-admin-page">
        <div className="container mt-5">
          <div className="alert alert-warning" role="alert">
            No restaurant assigned to your account. Please contact the administrator.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="campus-admin-page">
      <div className="container-fluid py-4">
        <div className="admin-header mb-4">
          <h1>🍽️ Restaurant Manager Dashboard</h1>
          <p className="lead">
            Managing: <strong>{restaurant.name}</strong>
          </p>
          <p className="text-muted">
            Campus: {userData?.campusName} | University: {userData?.universityName}
          </p>
        </div>

        {/* Restaurant Information Card */}
        <div className="card mb-4" style={{ 
          backgroundColor: 'rgba(44, 62, 80, 0.95)', 
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="card-body">
            <h4 className="card-title mb-4" style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.2)', paddingBottom: '10px' }}>
              🏪 Restaurant Information
            </h4>
            <div className="row">
              <div className="col-md-6 mb-3">
                <p className="mb-2"><strong style={{ color: '#3498db' }}>Name:</strong> {restaurant.name}</p>
                <p className="mb-2"><strong style={{ color: '#3498db' }}>Location:</strong> {restaurant.location || 'N/A'}</p>
                {restaurant.phone && <p className="mb-2"><strong style={{ color: '#3498db' }}>Phone:</strong> {restaurant.phone}</p>}
              </div>
              <div className="col-md-6 mb-3">
                {restaurant.is24x7 ? (
                  <p className="mb-2"><strong style={{ color: '#3498db' }}>Availability:</strong> Open 24/7</p>
                ) : (
                  <>
                    <p className="mb-2"><strong style={{ color: '#3498db' }}>Opening Time:</strong> {restaurant.openTime || restaurant.openingTime || 'N/A'}</p>
                    <p className="mb-2"><strong style={{ color: '#3498db' }}>Closing Time:</strong> {restaurant.closeTime || restaurant.closingTime || 'N/A'}</p>
                  </>
                )}
              </div>
            </div>
            {restaurant.imageUrl && (
              <div className="mt-3">
                <img 
                  src={restaurant.imageUrl} 
                  alt={restaurant.name}
                  className="img-fluid rounded"
                  style={{ 
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    border: '2px solid rgba(255, 255, 255, 0.2)'
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Orders Section */}
        <div className="card" style={{ 
          backgroundColor: 'rgba(44, 62, 80, 0.95)', 
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="card-body">
            <button
              className="btn btn-primary w-100 d-flex justify-content-between align-items-center mb-3"
              onClick={() => setIsOrdersOpen(!isOrdersOpen)}
              style={{
                backgroundColor: 'rgba(74, 85, 104, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '12px 20px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              <span>📦 All Orders</span>
              <span>{isOrdersOpen ? '▲' : '▼'}</span>
            </button>
            {isOrdersOpen && (
              <RestaurantManagerOrdersPanel 
                restaurantId={userData.restaurantId} 
                restaurantName={restaurant.name}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantManager;

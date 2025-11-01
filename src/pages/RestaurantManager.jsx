import React, { useState, useEffect, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { api, authHeaders } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import RestaurantManagerOrdersPanel from "../components/RestaurantManagerOrdersPanel";
import { handleError } from "../utils/errorHandler";
import "../styles/RestaurantManager.css";
const RestaurantManagerCRM = React.lazy(() => import("../components/RestaurantManagerCRM"));

const RestaurantManager = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurant, setRestaurant] = useState(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0
  });

  useEffect(() => {
    if (userData?.restaurantId) {
      fetchRestaurantDetails();
      fetchStats();
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

  const fetchStats = async () => {
    try {
      const headers = await authHeaders(user);
      const response = await api.get(`/api/orders/restaurant/${userData.restaurantId}?limit=1000`, { headers });
      const orders = response.data || [];
      
      const today = new Date().setHours(0, 0, 0, 0);
      const todayOrders = orders.filter(order => 
        new Date(order.createdAt).setHours(0, 0, 0, 0) === today
      );
      
      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => ['pending', 'accepted', 'preparing'].includes(o.status)).length,
        completedOrders: orders.filter(o => o.status === 'delivered').length,
        todayRevenue: todayOrders.reduce((sum, o) => sum + (o.itemsTotal || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  if (loading) {
    return (
      <div className="rm-loading-screen">
        <LoadingSpinner message="Loading restaurant details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rm-dashboard">
        <div className="rm-container">
          <div className="rm-error-card">
            <div className="rm-error-icon">⚠️</div>
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="rm-dashboard">
        <div className="rm-container">
          <div className="rm-warning-card">
            <div className="rm-warning-icon">ℹ️</div>
            <h3>No Restaurant Assigned</h3>
            <p>No restaurant is assigned to your account. Please contact the administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-dashboard">
      {/* Header Section */}
      <div className="rm-header">
        <div className="rm-container">
          <div className="rm-header-content">
            <div className="rm-header-left">
              <div className="rm-restaurant-badge">
                <span className="rm-badge-icon">🍽️</span>
                <span className="rm-badge-text">Restaurant Manager</span>
              </div>
              <h1 className="rm-restaurant-name">{restaurant.name}</h1>
              <div className="rm-breadcrumb">
                <span>{userData?.universityName}</span>
                <span className="rm-breadcrumb-separator">›</span>
                <span>{userData?.campusName}</span>
              </div>
            </div>
            <div className="rm-header-right">
              <div className="rm-status-indicator">
                <span className="rm-status-dot"></span>
                <span className="rm-status-text">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs within Restaurant Manager dashboard */}
      <div className="rm-container" style={{marginTop: '1rem'}}>
        <ul className="nav nav-tabs mb-3">
          <li className="nav-item"><button className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button></li>
          <li className="nav-item"><button className={`nav-link ${activeTab === 'crm' ? 'active' : ''}`} onClick={() => setActiveTab('crm')}>📈 CRM</button></li>
        </ul>
      </div>

      {/* Stats Cards */}
      <div className="rm-stats-section">
        <div className="rm-container">
          <div className="rm-stats-grid">
            <div className="rm-stat-card rm-stat-primary">
              <div className="rm-stat-icon-wrapper">
                <div className="rm-stat-icon">📦</div>
              </div>
              <div className="rm-stat-content">
                <div className="rm-stat-value">{stats.totalOrders}</div>
                <div className="rm-stat-label">Total Orders</div>
              </div>
            </div>

            <div className="rm-stat-card rm-stat-warning">
              <div className="rm-stat-icon-wrapper">
                <div className="rm-stat-icon">⏳</div>
              </div>
              <div className="rm-stat-content">
                <div className="rm-stat-value">{stats.pendingOrders}</div>
                <div className="rm-stat-label">Pending Orders</div>
              </div>
            </div>

            <div className="rm-stat-card rm-stat-success">
              <div className="rm-stat-icon-wrapper">
                <div className="rm-stat-icon">✅</div>
              </div>
              <div className="rm-stat-content">
                <div className="rm-stat-value">{stats.completedOrders}</div>
                <div className="rm-stat-label">Completed</div>
              </div>
            </div>

            <div className="rm-stat-card rm-stat-revenue">
              <div className="rm-stat-icon-wrapper">
                <div className="rm-stat-icon">💰</div>
              </div>
              <div className="rm-stat-content">
                <div className="rm-stat-value">Rs. {stats.todayRevenue.toFixed(0)}</div>
                <div className="rm-stat-label">Today's Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="rm-main-content">
        <div className="rm-container">
          {activeTab === 'crm' ? (
            <Suspense fallback={<LoadingSpinner message="Loading CRM..." /> }>
              <RestaurantManagerCRM />
            </Suspense>
          ) : (
            <div className="rm-content-grid">
            {/* Restaurant Information Card */}
            <div className="rm-info-card">
              <div className="rm-card-header">
                <h2 className="rm-card-title">
                  <span className="rm-title-icon">🏪</span>
                  Restaurant Information
                </h2>
              </div>
              <div className="rm-card-body">
                {restaurant.imageUrl && (
                  <div className="rm-restaurant-image">
                    <img src={restaurant.imageUrl} alt={restaurant.name} />
                  </div>
                )}
                <div className="rm-info-grid">
                  <div className="rm-info-item">
                    <div className="rm-info-label">Restaurant Name</div>
                    <div className="rm-info-value">{restaurant.name}</div>
                  </div>
                  <div className="rm-info-item">
                    <div className="rm-info-label">Location</div>
                    <div className="rm-info-value">{restaurant.location || 'N/A'}</div>
                  </div>
                  {restaurant.phone && (
                    <div className="rm-info-item">
                      <div className="rm-info-label">Contact</div>
                      <div className="rm-info-value">{restaurant.phone}</div>
                    </div>
                  )}
                  <div className="rm-info-item">
                    <div className="rm-info-label">Operating Hours</div>
                    <div className="rm-info-value">
                      {restaurant.is24x7 ? (
                        <span className="rm-badge-24x7">Open 24/7</span>
                      ) : (
                        <span>{restaurant.openTime || restaurant.openingTime || 'N/A'} - {restaurant.closeTime || restaurant.closingTime || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="rm-orders-section">
              <div className="rm-orders-card">
                <div className="rm-card-header rm-orders-header">
                  <h2 className="rm-card-title">
                    <span className="rm-title-icon">📋</span>
                    Order Management
                  </h2>
                  <button
                    className="rm-toggle-btn"
                    onClick={() => setIsOrdersOpen(!isOrdersOpen)}
                  >
                    {isOrdersOpen ? '▼' : '▶'}
                  </button>
                </div>
                {isOrdersOpen && (
                  <div className="rm-card-body rm-orders-body">
                    <RestaurantManagerOrdersPanel 
                      restaurantId={userData.restaurantId} 
                      restaurantName={restaurant.name}
                      onOrderUpdate={fetchStats}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantManager;

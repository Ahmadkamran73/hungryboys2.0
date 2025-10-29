import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';
import { api, authHeaders } from '../utils/api';
import '../styles/CampusAdminDashboard.css';

const CampusAdminDashboard = () => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (userData && userData.role === 'campusAdmin') {
      initializeDashboard();
    } else {
      setError('Access denied. Campus Admin privileges required.');
      setLoading(false);
    }
  }, [userData]);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      if (!userData.universityName || !userData.campusName) {
        setError('University and campus information not found. Please contact the Super Admin.');
        return;
      }

      // Fetch orders once for stats
      const response = await api.get('/api/orders', {
        headers: await authHeaders(user)
      });
      // Note: authHeaders ignores passed object and uses firebase auth user in implementation; fallback kept for API shape.
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      const handledError = handleError(err, 'CampusAdminDashboard - initializeDashboard');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    if (!orders?.length) return {
      total: 0,
      revenue: 0,
      today: 0,
      week: 0,
      avg: 0,
      byStatus: {}
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);

    let revenue = 0;
    let today = 0;
    let week = 0;
    const byStatus = {};

    for (const o of orders) {
      const created = new Date(o.createdAt);
      revenue += Number(o.grandTotal || 0);
      if (created >= startOfToday) today += 1;
      if (created >= weekAgo) week += 1;
      const s = o.status || 'pending';
      byStatus[s] = (byStatus[s] || 0) + 1;
    }

    return {
      total: orders.length,
      revenue,
      today,
      week,
      avg: orders.length ? revenue / orders.length : 0,
      byStatus
    };
  }, [orders]);

  // Removed Recent Orders list to keep dashboard focused on KPIs only

  if (loading) {
    return (
      <div className="campus-dashboard-container">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="campus-dashboard-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }



  return (
    <div className="campus-dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Campus Admin Dashboard</h2>
        <p className="text-muted">
          Managing orders for {userData?.universityName} - {userData?.campusName}
        </p>
      </div>

      {/* Key Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">Rs. {stats.revenue.toFixed(2)}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.today}</div>
            <div className="stat-label">Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div className="stat-value">Rs. {stats.avg.toFixed(2)}</div>
            <div className="stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="orders-section mb-4">
        <div className="orders-header">
          <h4>Status Breakdown</h4>
        </div>
        <div className="row g-3">
          {Object.entries(stats.byStatus).map(([k,v]) => (
            <div className="col-6 col-md-3" key={k}>
              <div className="stat-card" style={{gap: '0.75rem'}}>
                <div className="stat-icon" style={{background:'rgba(102,126,234,0.2)', color:'#c5cbff'}}>⏱️</div>
                <div>
                  <div className="stat-value" style={{fontSize:'1.1rem'}}>{v}</div>
                  <div className="stat-label text-uppercase">{k}</div>
                </div>
              </div>
            </div>
          ))}
          {Object.keys(stats.byStatus).length === 0 && (
            <div className="text-center text-muted">No orders yet.</div>
          )}
        </div>
      </div>

      {/* Recent Orders section removed as requested */}
    </div>
  );
};

export default CampusAdminDashboard; 
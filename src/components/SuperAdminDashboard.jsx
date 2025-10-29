import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllSheetTabs } from '../utils/googleSheets';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';
import '../styles/SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const { userData } = useAuth();
  const [sheetTabs, setSheetTabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userData && userData.role === 'superAdmin') {
      fetchSheetTabs();
    } else {
      setError('Access denied. Super Admin privileges required.');
      setLoading(false);
    }
  }, [userData]);

  const fetchSheetTabs = async () => {
    try {
      setLoading(true);
      const tabs = await getAllSheetTabs();
      // Filter out the Master tab and sort by name
      const campusTabs = tabs
        .filter(tab => tab.name !== 'Master')
        .sort((a, b) => a.name.localeCompare(b.name));
      setSheetTabs(campusTabs);
    } catch (err) {
      const handledError = handleError(err, 'SuperAdminDashboard - fetchSheetTabs');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="dashboard-container">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }



  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h2>📊 Super Admin Dashboard</h2>
        <p className="text-muted">Manage and view orders from all campuses</p>
      </div>



      <div className="dashboard-content">
        {/* Sheet Tabs List */}
        <div className="sheet-tabs-section">
          <h4>📋 Campus Order Sheets</h4>
          <div className="sheet-tabs-grid">
            {sheetTabs.map((tab) => (
              <div
                key={tab.sheetId}
                className="sheet-tab-card"
              >
                <div className="tab-name">{tab.name}</div>
                <div className="tab-actions">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open('https://docs.google.com/spreadsheets/d/1VCvhWcx3vOtxeiPe5KuWuDIbWSKfvRZkv4Y1P_M6QuM', '_blank');
                    }}
                  >
                    View Orders
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </div>
  );
};

export default SuperAdminDashboard; 
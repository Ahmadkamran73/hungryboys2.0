import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sheetTabExists } from '../utils/googleSheets';
import { handleError } from '../utils/errorHandler';
import LoadingSpinner from './LoadingSpinner';
import '../styles/CampusAdminDashboard.css';

const CampusAdminDashboard = () => {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // Check if sheet exists
      const exists = await sheetTabExists(userData.universityName, userData.campusName);
      if (!exists) {
        setError(`Order sheet for ${userData.universityName} - ${userData.campusName} not found. Please contact the Super Admin.`);
        return;
      }
    } catch (err) {
      const handledError = handleError(err, 'CampusAdminDashboard - initializeDashboard');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

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



      {/* View Orders Button */}
      <div className="orders-section">
        <div className="orders-header">
          <h4>📦 Campus Orders</h4>
          <div className="orders-actions">
            <button
              className="btn btn-primary"
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/1VCvhWcx3vOtxeiPe5KuWuDIbWSKfvRZkv4Y1P_M6QuM', '_blank')}
            >
              📋 View Orders in Google Sheets
            </button>
          </div>
        </div>
        <div className="text-center text-muted mt-3">
          <p>Click the button above to view and manage orders directly in Google Sheets</p>
        </div>
      </div>
    </div>
  );
};

export default CampusAdminDashboard; 
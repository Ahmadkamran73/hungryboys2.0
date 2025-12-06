import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { api, authHeaders } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/GlobalDeliveryFeeManager.css";

const GlobalDeliveryFeeManager = () => {
  const { user, userData } = useAuth();
  const [deliveryFee, setDeliveryFee] = useState(150);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newDeliveryFee, setNewDeliveryFee] = useState('');

  useEffect(() => {
    if (userData && userData.role === 'superAdmin') {
      fetchGlobalDeliveryFee();
    } else {
      setError('Access denied. Super Admin privileges required.');
      setLoading(false);
    }
  }, [userData]);

  const fetchGlobalDeliveryFee = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      const response = await api.get('/api/global-delivery-fee', {
        headers: await authHeaders(user)
      });
      
      setDeliveryFee(response.data.deliveryFee);
      setNewDeliveryFee(response.data.deliveryFee.toString());
    } catch (err) {
      const handledError = handleError(err, 'GlobalDeliveryFeeManager - fetchGlobalDeliveryFee');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate delivery fee
      const feeValue = parseInt(newDeliveryFee);
      if (isNaN(feeValue) || feeValue <= 0) {
        setError('Delivery fee must be a positive number');
        return;
      }

      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Save to backend
      await api.post('/api/global-delivery-fee', 
        { deliveryFee: feeValue },
        { headers: await authHeaders(user) }
      );

      setDeliveryFee(feeValue);
      setIsEditing(false);
      setSuccess('Global delivery fee updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      const handledError = handleError(err, 'GlobalDeliveryFeeManager - saveDeliveryFee');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewDeliveryFee(deliveryFee.toString());
    setError('');
    setSuccess('');
  };

  if (loading && !isEditing) {
    return <LoadingSpinner />;
  }

  return (
    <div className="global-delivery-fee-manager">
      <div className="fee-header">
        <h3>Global Delivery Fee Settings</h3>
        <p className="text-muted">
          Set the default delivery fee per person. This will be used as the fallback when no campus-specific fee is configured.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      <div className="fee-card">
        {!isEditing ? (
          <div className="fee-display">
            <div className="fee-info">
              <label className="fee-label">Current Global Delivery Fee (per person)</label>
              <div className="fee-value">
                <span className="currency">Rs</span>
                <span className="amount">{deliveryFee}</span>
              </div>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Update Fee
            </button>
          </div>
        ) : (
          <div className="fee-edit">
            <div className="form-group">
              <label htmlFor="deliveryFee" className="form-label">
                New Delivery Fee (per person)
              </label>
              <div className="input-group">
                <span className="input-group-text">Rs</span>
                <input
                  type="number"
                  id="deliveryFee"
                  className="form-control"
                  value={newDeliveryFee}
                  onChange={(e) => setNewDeliveryFee(e.target.value)}
                  min="1"
                  step="1"
                  placeholder="Enter delivery fee"
                  disabled={loading}
                />
              </div>
              <small className="form-text text-muted">
                Enter the delivery fee amount in Pakistani Rupees (PKR)
              </small>
            </div>
            <div className="button-group">
              <button 
                className="btn btn-success"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="fee-info-section">
        <h5>How it works:</h5>
        <ul>
          <li>This global fee is applied as the default delivery charge for all campuses</li>
          <li>Campus admins can override this with campus-specific fees in Campus Settings</li>
          <li>The fee is charged per person ordering together</li>
          <li>Changes take effect immediately for all new orders</li>
        </ul>
      </div>
    </div>
  );
};

export default GlobalDeliveryFeeManager;

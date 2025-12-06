import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import { api, authHeaders } from "../utils/api";
import LoadingSpinner from "./LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/CampusSettingsManager.css";

const CampusSettingsManager = () => {
  const { user, userData } = useAuth();
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [campusSettings, setCampusSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [editingSettings, setEditingSettings] = useState(null);

  useEffect(() => {
    if (userData && userData.role === 'superAdmin') {
      fetchData();
    } else {
      setError('Access denied. Super Admin privileges required.');
      setLoading(false);
    }
  }, [userData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch universities from MongoDB
      const universitiesResponse = await api.get('/api/universities');
      setUniversities(universitiesResponse.data);

      // Fetch campuses from MongoDB
      const campusesResponse = await api.get('/api/campuses');
      setCampuses(campusesResponse.data);

      // Fetch all campus settings from MongoDB
      await fetchCampusSettings();

    } catch (err) {
      const handledError = handleError(err, 'CampusSettingsManager - fetchData');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampusSettings = async () => {
    try {
      if (!user) return;
      
      // Fetch all campus settings from MongoDB
      const response = await api.get('/api/campus-settings', {
        headers: await authHeaders(user)
      });
      
      const settings = {};
      response.data.forEach(setting => {
        settings[setting.campusId] = setting;
      });
      
      setCampusSettings(settings);
    } catch (err) {
      console.error('Error fetching campus settings:', err);
      // Don't show error to user, just use empty settings
    }
  };

  const handleUniversityChange = (universityId) => {
    setSelectedUniversity(universityId);
    setSelectedCampus('');
  };

  const handleCampusChange = (campusId) => {
    setSelectedCampus(campusId);
    if (campusId && campusSettings[campusId]) {
      setEditingSettings(campusSettings[campusId]);
    } else {
      setEditingSettings({
        deliveryChargePerPerson: '', // Empty for user to fill
        accountTitle: "Maratib Ali",
        bankName: "SadaPay",
        accountNumber: "03330374616"
      });
    }
  };

  const handleSettingsChange = (field, value) => {
    setEditingSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    if (!selectedCampus) {
      setError('Please select a campus');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const campus = campuses.find(c => c.id === selectedCampus);
      if (!campus) {
        setError('Campus not found');
        return;
      }

      // Validate settings
      if (!editingSettings.deliveryChargePerPerson || editingSettings.deliveryChargePerPerson <= 0) {
        setError('Delivery charge must be greater than 0');
        return;
      }

      if (!editingSettings.accountTitle || !editingSettings.bankName || !editingSettings.accountNumber) {
        setError('All payment details are required');
        return;
      }

      // Save to MongoDB via API
      const settingsData = {
        campusId: selectedCampus,
        deliveryChargePerPerson: parseInt(editingSettings.deliveryChargePerPerson),
        accountTitle: editingSettings.accountTitle.trim(),
        bankName: editingSettings.bankName.trim(),
        accountNumber: editingSettings.accountNumber.trim()
      };

      await api.post('/api/campus-settings', settingsData, {
        headers: await authHeaders(user)
      });

      // Update local state
      setCampusSettings(prev => ({
        ...prev,
        [selectedCampus]: settingsData
      }));

      setSuccess(`Settings saved successfully for ${campus.name}`);
      
    } catch (err) {
      const handledError = handleError(err, 'CampusSettingsManager - saveSettings');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCampuses = () => {
    if (!selectedUniversity) return campuses;
    return campuses.filter(campus => campus.universityId === selectedUniversity);
  };

  if (loading) {
    return (
      <div className="campus-settings-container">
        <LoadingSpinner message="Loading campus settings..." />
      </div>
    );
  }

  if (error && !selectedCampus) {
    return (
      <div className="campus-settings-container">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="campus-settings-modern">
      <div className="settings-header-modern">
        <div className="header-content">
          <div className="header-icon">
            <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/>
            </svg>
          </div>
          <div className="header-text">
            <h3>Campus Settings Management</h3>
            <p>Configure delivery charges and payment details for each campus</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert-modern alert-danger-modern">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert-modern alert-success-modern">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
          <span>{success}</span>
        </div>
      )}

      <div className="settings-content-modern">
        {/* Campus Selection Card */}
        <div className="selection-card">
          <div className="card-header-modern">
            <h5>Select Campus</h5>
          </div>
          <div className="card-body-modern">
            <div className="selection-grid">
              <div className="selection-item">
                <label className="modern-label">Select University</label>
                <select 
                  className="modern-select"
                  value={selectedUniversity}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                >
                  <option value="">Choose University</option>
                  {universities.map(university => (
                    <option key={university.id} value={university.id}>
                      {university.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="selection-item">
                <label className="modern-label">Select Campus</label>
                <select 
                  className="modern-select"
                  value={selectedCampus}
                  onChange={(e) => handleCampusChange(e.target.value)}
                  disabled={!selectedUniversity}
                >
                  <option value="">Choose Campus</option>
                  {getFilteredCampuses().map(campus => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Form */}
        {selectedCampus && editingSettings && (
          <>
            {/* Delivery Charges Card */}
            <div className="settings-card">
              <div className="card-header-modern">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7zm1.294 7.456A1.999 1.999 0 0 1 4.732 11h5.536a2.01 2.01 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456zM12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12v4zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
                </svg>
                <h5>Delivery Charges</h5>
              </div>
              <div className="card-body-modern">
                <div className="form-group-modern">
                  <label className="modern-label">Delivery Charge per Person</label>
                  <div className="input-with-prefix">
                    <span className="prefix">Rs</span>
                    <input
                      type="number"
                      className="modern-input"
                      value={editingSettings.deliveryChargePerPerson}
                      onChange={(e) => handleSettingsChange('deliveryChargePerPerson', e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                  <small className="input-hint">Amount charged per person for delivery</small>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="settings-card">
              <div className="card-header-modern">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z"/>
                  <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z"/>
                </svg>
                <h5>Payment Details</h5>
              </div>
              <div className="card-body-modern">
                <div className="payment-grid">
                  <div className="form-group-modern">
                    <label className="modern-label">Account Title</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={editingSettings.accountTitle}
                      onChange={(e) => handleSettingsChange('accountTitle', e.target.value)}
                      placeholder="Enter account title"
                      pattern="[A-Za-z\s]+"
                      title="Only letters and spaces are allowed"
                      required
                    />
                  </div>
                  <div className="form-group-modern">
                    <label className="modern-label">Bank Name</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={editingSettings.bankName}
                      onChange={(e) => handleSettingsChange('bankName', e.target.value)}
                      placeholder="Enter bank name"
                      pattern="[A-Za-z\s]+"
                      title="Only letters and spaces are allowed"
                      required
                    />
                  </div>
                  <div className="form-group-modern full-width">
                    <label className="modern-label">Account Number</label>
                    <input
                      type="text"
                      className="modern-input"
                      value={editingSettings.accountNumber}
                      onChange={(e) => handleSettingsChange('accountNumber', e.target.value)}
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="action-section">
              <button 
                className="btn-save-modern"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v7.293l2.646-2.647a.5.5 0 0 1 .708.708l-3.5 3.5a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L7.5 9.293V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z"/>
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>

            {/* Current Settings Preview */}
            {campusSettings[selectedCampus] && (
              <div className="preview-card">
                <div className="card-header-modern">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
                  </svg>
                  <h5>Current Settings Preview</h5>
                </div>
                <div className="preview-grid">
                  <div className="preview-item-modern">
                    <span className="preview-label">Delivery Charge</span>
                    <span className="preview-value">Rs {campusSettings[selectedCampus].deliveryChargePerPerson} per person</span>
                  </div>
                  <div className="preview-item-modern">
                    <span className="preview-label">Account Title</span>
                    <span className="preview-value">{campusSettings[selectedCampus].accountTitle}</span>
                  </div>
                  <div className="preview-item-modern">
                    <span className="preview-label">Bank</span>
                    <span className="preview-value">{campusSettings[selectedCampus].bankName}</span>
                  </div>
                  <div className="preview-item-modern">
                    <span className="preview-label">Account Number</span>
                    <span className="preview-value">{campusSettings[selectedCampus].accountNumber}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CampusSettingsManager;

import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  setDoc,
  query,
  where 
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "./LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/CampusSettingsManager.css";

const CampusSettingsManager = () => {
  const { userData } = useAuth();
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
      
      // Fetch universities
      const universitiesSnapshot = await getDocs(collection(db, "universities"));
      const universitiesData = universitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUniversities(universitiesData);

      // Fetch all campuses
      const allCampuses = [];
      for (const university of universitiesData) {
        const campusesSnapshot = await getDocs(collection(db, "universities", university.id, "campuses"));
        const campusesData = campusesSnapshot.docs.map(doc => ({
          id: doc.id,
          universityId: university.id,
          universityName: university.name,
          ...doc.data()
        }));
        allCampuses.push(...campusesData);
      }
      setCampuses(allCampuses);

      // Fetch campus settings
      await fetchCampusSettings(allCampuses);

    } catch (err) {
      const handledError = handleError(err, 'CampusSettingsManager - fetchData');
      setError(handledError.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampusSettings = async (allCampuses) => {
    try {
      const settings = {};
      
      for (const campus of allCampuses) {
        try {
          const settingsDoc = await getDocs(collection(db, "universities", campus.universityId, "campuses", campus.id, "settings"));
          if (!settingsDoc.empty) {
            const settingData = settingsDoc.docs[0].data();
            settings[campus.id] = {
              id: settingsDoc.docs[0].id,
              ...settingData
            };
          } else {
            // Set default settings if none exist
            settings[campus.id] = {
              deliveryChargePerPerson: 150,
              accountTitle: "Maratib Ali",
              bankName: "SadaPay",
              accountNumber: "03330374616"
            };
          }
        } catch (err) {
          console.warn(`Failed to fetch settings for campus ${campus.name}:`, err);
          // Set default settings on error
          settings[campus.id] = {
            deliveryChargePerPerson: 150,
            accountTitle: "Maratib Ali",
            bankName: "SadaPay",
            accountNumber: "03330374616"
          };
        }
      }
      
      setCampusSettings(settings);
    } catch (err) {
      console.error('Error fetching campus settings:', err);
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
        deliveryChargePerPerson: 150,
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

      // Save to Firestore
      const settingsRef = doc(db, "universities", campus.universityId, "campuses", campus.id, "settings", "payment");
      await setDoc(settingsRef, {
        deliveryChargePerPerson: parseInt(editingSettings.deliveryChargePerPerson),
        accountTitle: editingSettings.accountTitle.trim(),
        bankName: editingSettings.bankName.trim(),
        accountNumber: editingSettings.accountNumber.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: userData.email
      });

      // Update local state
      setCampusSettings(prev => ({
        ...prev,
        [selectedCampus]: editingSettings
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
    <div className="campus-settings-container">
      <div className="settings-header">
        <h3>🏢 Campus Settings Management</h3>
        <p className="text-muted">Configure delivery charges and payment details for each campus</p>
      </div>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      {success && (
        <div className="alert alert-success">{success}</div>
      )}

      <div className="settings-content">
        {/* Campus Selection */}
        <div className="campus-selection">
          <div className="row">
            <div className="col-md-6">
              <label className="form-label">Select University</label>
              <select 
                className="form-select"
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
            <div className="col-md-6">
              <label className="form-label">Select Campus</label>
              <select 
                className="form-select"
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

        {/* Settings Form */}
        {selectedCampus && editingSettings && (
          <div className="settings-form">
            <div className="form-section">
              <h5>Delivery Charges</h5>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Delivery Charge per Person (Rs)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editingSettings.deliveryChargePerPerson}
                    onChange={(e) => handleSettingsChange('deliveryChargePerPerson', e.target.value)}
                    min="1"
                    required
                  />
                  <small className="text-muted">Amount charged per person for delivery</small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h5>Payment Details</h5>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label">Account Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingSettings.accountTitle}
                    onChange={(e) => handleSettingsChange('accountTitle', e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Bank Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingSettings.bankName}
                    onChange={(e) => handleSettingsChange('bankName', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <label className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingSettings.accountNumber}
                    onChange={(e) => handleSettingsChange('accountNumber', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Current Settings Overview */}
        {selectedCampus && campusSettings[selectedCampus] && (
          <div className="current-settings">
            <h5>Current Settings Preview</h5>
            <div className="settings-preview">
              <div className="preview-item">
                <strong>Delivery Charge:</strong> Rs {campusSettings[selectedCampus].deliveryChargePerPerson} per person
              </div>
              <div className="preview-item">
                <strong>Account Title:</strong> {campusSettings[selectedCampus].accountTitle}
              </div>
              <div className="preview-item">
                <strong>Bank:</strong> {campusSettings[selectedCampus].bankName}
              </div>
              <div className="preview-item">
                <strong>Account Number:</strong> {campusSettings[selectedCampus].accountNumber}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusSettingsManager;

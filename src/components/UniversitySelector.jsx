import React, { useState } from "react";
import { useUniversity } from "../context/UniversityContext";
import "../styles/UniversitySelector.css";

const UniversitySelector = () => {
  const {
    universities,
    campuses,
    selectedUniversity,
    selectedCampus,
    setSelectedUniversity,
    setSelectedCampus,
    loading
  } = useUniversity();

  const [showDropdown, setShowDropdown] = useState(false);

  const handleUniversityChange = (university) => {
    setSelectedUniversity(university);
    setSelectedCampus(null); // Reset campus when university changes
  };

  const handleCampusChange = (campus) => {
    setSelectedCampus(campus);
    setShowDropdown(false);
  };

  const getDisplayText = () => {
    if (loading) return "Loading...";
    if (!selectedUniversity) return "Select University";
    if (!selectedCampus) return `${selectedUniversity.name} - Select Campus`;
    return `${selectedUniversity.name} - ${selectedCampus.name}`;
  };

  return (
    <div className="university-selector-container">
      <div className="dropdown">
        <button
          className="btn btn-outline-light dropdown-toggle university-selector-btn"
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={loading}
        >
          <i className="fas fa-university me-2"></i>
          {getDisplayText()}
        </button>

        {showDropdown && !loading && (
          <div className="dropdown-menu show university-dropdown">
            {/* University Section */}
            <div className="dropdown-section">
              <h6 className="dropdown-header">Select University</h6>
              {universities.length === 0 ? (
                <div className="dropdown-item text-muted">
                  <small>No universities available</small>
                </div>
              ) : (
                universities.map((university) => (
                  <button
                    key={university.id}
                    className={`dropdown-item ${selectedUniversity?.id === university.id ? 'active' : ''}`}
                    onClick={() => handleUniversityChange(university)}
                  >
                    <i className="fas fa-graduation-cap me-2"></i>
                    {university.name}
                  </button>
                ))
              )}
            </div>

            {/* Campus Section */}
            {selectedUniversity && (
              <div className="dropdown-section">
                <h6 className="dropdown-header">Select Campus</h6>
                {campuses.length === 0 ? (
                  <div className="dropdown-item text-muted">
                    <small>No campuses available for this university</small>
                  </div>
                ) : (
                  campuses.map((campus) => (
                    <button
                      key={campus.id}
                      className={`dropdown-item ${selectedCampus?.id === campus.id ? 'active' : ''}`}
                      onClick={() => handleCampusChange(campus)}
                    >
                      <i className="fas fa-building me-2"></i>
                      <div>
                        <div className="campus-name">{campus.name}</div>
                        {campus.location && (
                          <small className="text-muted">{campus.location}</small>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Clear Selection */}
            {(selectedUniversity || selectedCampus) && (
              <>
                <div className="dropdown-divider"></div>
                <button
                  className="dropdown-item text-danger"
                  onClick={() => {
                    setSelectedUniversity(null);
                    setSelectedCampus(null);
                    setShowDropdown(false);
                  }}
                >
                  <i className="fas fa-times me-2"></i>
                  Clear Selection
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversitySelector; 
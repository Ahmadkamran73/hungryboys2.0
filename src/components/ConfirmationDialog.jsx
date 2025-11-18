import React from 'react';
import '../styles/ConfirmationDialog.css';

const ConfirmationDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return '!';
      case 'warning':
        return '!';
      case 'info':
        return 'i';
      default:
        return '?';
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'btn-danger';
      case 'warning':
        return 'btn-warning';
      case 'info':
        return 'btn-info';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div className="confirmation-dialog-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-dialog">
        <div className="confirmation-dialog-header">
          <div className="confirmation-dialog-icon">
            {getIcon()}
          </div>
          <h5 className="confirmation-dialog-title">{title}</h5>
        </div>
        
        <div className="confirmation-dialog-body">
          <p className="confirmation-dialog-message">{message}</p>
        </div>
        
        <div className="confirmation-dialog-footer">
          <button 
            className="btn btn-secondary confirmation-dialog-btn" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className={`btn ${getButtonClass()} confirmation-dialog-btn`} 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 
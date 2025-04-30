import React from 'react';
import whatsappIcon from '../assets/whatsapp.png'; // Import image
import '../styles/WhatsAppIcon.css'; // Optional: If you want custom styles

const WhatsAppIcon = () => {
  return (
    <div className="whatsapp-icon">
      {/* WhatsApp Icon */}
      <a
        href="https://wa.me/+923330374616"  // Replace with your phone number
        target="_blank"
        rel="noopener noreferrer"
        title="Chat with us on WhatsApp"
      >
        <img
          src={whatsappIcon}  // Use imported image here
          alt="WhatsApp Icon"
          className="whatsapp-icon-img"
        />
      </a>
    </div>
  );
};

export default WhatsAppIcon;

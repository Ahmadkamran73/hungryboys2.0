import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUniversity } from '../context/UniversityContext';
import './Home.css';

function Home() {
  const { selectedUniversity, selectedCampus } = useUniversity();

  const features = [
    {
      icon: "🚀",
      title: "Fast Delivery",
      description: "Get your food delivered within 30-45 minutes"
    },
    {
      icon: "💰",
      title: "Batch Delivery",
      description: "Smart cost-effective delivery to remote areas"
    },
    {
      icon: "🍽️",
      title: "Wide Selection",
      description: "Choose from multiple restaurants & mart items"
    },
    {
      icon: "📱",
      title: "Easy Ordering",
      description: "Simple and intuitive ordering process"
    }
  ];

  const stats = [
    { number: "500+", label: "Happy Customers" },
    { number: "50+", label: "Partner Restaurants" },
    { number: "1000+", label: "Orders Delivered" },
    { number: "24/7", label: "Customer Support" }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">🚀 Trusted by students. Fast, reliable, and always fresh!</div>
          <h1 className="hero-title">
            Your Cravings,<br />
            <span className="hero-highlight">Delivered Fresh</span>
          </h1>
          <p className="hero-subtitle">
            Experience the best food delivery service on campus. From your favorite restaurants to essential mart items, we deliver it all with care.
          </p>

          {selectedUniversity && selectedCampus ? (
            <div className="hero-location">
              <div className="location-badge">
                <span className="location-icon">📍</span>
                <span className="location-text">
                  {selectedUniversity.name} - {selectedCampus.name}
                </span>
              </div>
              <div className="hero-buttons">
                <Link to="/restaurants" className="btn-primary">
                  <span>Browse Restaurants</span>
                  <span className="btn-icon">→</span>
                </Link>
                <Link to="/mart-items" className="btn-secondary">
                  <span>Shop Mart Items</span>
                  <span className="btn-icon">🛒</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="hero-prompt">
              <div className="prompt-card">
                <div className="prompt-icon">📍</div>
                <h3>Select Your Location</h3>
                <p>Choose your university and campus from the navigation bar to start exploring</p>
              </div>
            </div>
          )}
        </div>

        <div className="scroll-indicator">
          <div className="scroll-arrow">↓</div>
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose Hungry Boys?</h2>
            <p className="section-subtitle">We bring the best food experience right to your doorstep</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get your favorite food in 3 simple steps</p>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">🔍</div>
              <h3 className="step-title">Browse & Select</h3>
              <p className="step-description">Explore restaurants and menu items from your favorite places</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🛒</div>
              <h3 className="step-title">Add to Cart</h3>
              <p className="step-description">Choose your items and customize your order</p>
            </div>

            <div className="step-arrow">→</div>

            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">🚀</div>
              <h3 className="step-title">Fast Delivery</h3>
              <p className="step-description">Sit back and relax while we deliver to your location</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Order?</h2>
            <p className="cta-subtitle">Join thousands of satisfied customers and experience the convenience</p>
            {selectedUniversity && selectedCampus ? (
              <Link to="/restaurants" className="cta-button">
                Start Ordering Now
                <span className="cta-icon">→</span>
              </Link>
            ) : (
              <div className="cta-info">
                <p className="cta-hint">Select your university from the navigation bar to get started</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="info-section">
        <div className="container">
          <div className="info-content">
            <h3 className="info-title">About Our Service</h3>
            <p className="info-text">
              At Hungry Boys, we specialize in food delivery to even the remotest corners of campus life. 
              We've built a smart, batch-based delivery model that keeps costs low and satisfaction high. 
              Whether you're buried in assignments or just don't feel like stepping out, we've got your back—with 
              your favorite meals just a few clicks away.
            </p>
            <p className="info-highlight">More campuses coming soon. Stay hungry. 🍔</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

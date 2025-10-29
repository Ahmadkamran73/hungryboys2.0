import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import UniversitySelector from "./UniversitySelector";
import ThemeToggle from "./ThemeToggle";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const { user, userData, isSuperAdmin, isCampusAdmin, isRestaurantManager } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const cartItemCount = cart?.reduce((total, item) => total + item.quantity, 0) || 0;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu();
    closeUserMenu();
  }, [location]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.modern-navbar')) {
        closeUserMenu();
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isUserMenuOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`modern-navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link className="navbar-logo" to="/" onClick={closeMobileMenu}>
          <img src={logo} alt="Hungry Boys" className="navbar-logo-img" />
          <span className="navbar-logo-text">Hungry Boys</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar-desktop">
          <div className="navbar-links">
            <Link 
              className={`navbar-link ${isActive('/') ? 'active' : ''}`} 
              to="/"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12L12 3L21 12H18V20H15V14H9V20H6V12H3Z" fill="currentColor"/>
              </svg>
              <span>Home</span>
            </Link>
            <Link 
              className={`navbar-link ${isActive('/restaurants') ? 'active' : ''}`} 
              to="/restaurants"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4V8H4V4H8ZM10 4H14V8H10V4ZM16 4H20V8H16V4ZM8 10V14H4V10H8ZM14 10H10V14H14V10ZM16 10H20V14H16V10ZM8 16V20H4V16H8ZM10 16H14V20H10V16ZM20 16V20H16V16H20Z" fill="currentColor"/>
              </svg>
              <span>Restaurants</span>
            </Link>
            <Link 
              className={`navbar-link ${isActive('/mart-items') ? 'active' : ''}`} 
              to="/mart-items"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 4V2H17V4H20.007C20.555 4 21 4.445 21 4.993V21.007C21 21.555 20.555 22 20.007 22H3.993C3.445 22 3 21.555 3 21.007V4.993C3 4.445 3.445 4 3.993 4H7ZM7 6H5V20H19V6H17V8H7V6Z" fill="currentColor"/>
              </svg>
              <span>Mart Items</span>
            </Link>
            <Link 
              className={`navbar-link navbar-cart ${isActive('/cart') ? 'active' : ''}`} 
              to="/cart"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 4V2H17V4H20.007C20.555 4 21 4.445 21 4.993V21.007C21 21.555 20.555 22 20.007 22H3.993C3.445 22 3 21.555 3 21.007V4.993C3 4.445 3.445 4 3.993 4H7Z" fill="currentColor"/>
              </svg>
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </Link>
          </div>

          <div className="navbar-actions">
            {/* University Selector */}
            <div className="navbar-university">
              <UniversitySelector />
            </div>

            {/* Theme Toggle */}
            <div className="navbar-theme">
              <ThemeToggle />
            </div>

            {/* User Menu */}
            {user ? (
              <div className="navbar-user-menu">
                <button 
                  className="navbar-user-trigger"
                  onClick={toggleUserMenu}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                  </svg>
                  <span className="navbar-user-email">{user.email?.split('@')[0]}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 10L12 15L17 10H7Z" fill="currentColor"/>
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="navbar-dropdown">
                    <div className="navbar-dropdown-header">
                      <p className="navbar-dropdown-email">{user.email}</p>
                      <span className="navbar-dropdown-role">
                        {userData?.role === "superAdmin" ? "Super Admin" : 
                         userData?.role === "campusAdmin" ? "Campus Admin" : 
                         userData?.role === "restaurantManager" ? "Restaurant Manager" : 
                         "User"}
                      </span>
                    </div>

                    <div className="navbar-dropdown-links">
                      {isSuperAdmin() && (
                        <Link 
                          className="navbar-dropdown-link" 
                          to="/super-admin"
                          onClick={closeUserMenu}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                            <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                          </svg>
                          <span>Super Admin Dashboard</span>
                        </Link>
                      )}
                      {isCampusAdmin() && (
                        <Link 
                          className="navbar-dropdown-link" 
                          to={`/admin/${userData?.universityId}/${userData?.campusId}`}
                          onClick={closeUserMenu}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                            <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                          </svg>
                          <span>Campus Admin Dashboard</span>
                        </Link>
                      )}
                      {isRestaurantManager() && (
                        <Link 
                          className="navbar-dropdown-link" 
                          to="/restaurant-manager"
                          onClick={closeUserMenu}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM18 20H6V4H18V20Z" fill="currentColor"/>
                            <path d="M12 6H8V9H12V6Z" fill="currentColor"/>
                            <path d="M16 6H14V18H16V6Z" fill="currentColor"/>
                            <path d="M12 10H8V18H12V10Z" fill="currentColor"/>
                          </svg>
                          <span>Restaurant Manager</span>
                        </Link>
                      )}
                      <Link 
                        className="navbar-dropdown-link" 
                        to="/checkout"
                        onClick={closeUserMenu}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
                        </svg>
                        <span>Checkout</span>
                      </Link>
                    </div>

                    <div className="navbar-dropdown-footer">
                      <button 
                        className="navbar-dropdown-signout"
                        onClick={handleSignOut}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <Link className="navbar-auth-link" to="/login">Sign In</Link>
                <Link className="navbar-auth-button" to="/signup">Sign Up</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`navbar-mobile-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Mobile Menu */}
        <div className={`navbar-mobile ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-mobile-header">
            <span className="navbar-mobile-title">Menu</span>
            <button className="navbar-mobile-close" onClick={closeMobileMenu}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
            </button>
          </div>

          <div className="navbar-mobile-content">
            <div className="navbar-mobile-links">
              <Link 
                className={`navbar-mobile-link ${isActive('/') ? 'active' : ''}`} 
                to="/"
                onClick={closeMobileMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L12 3L21 12H18V20H15V14H9V20H6V12H3Z" fill="currentColor"/>
                </svg>
                <span>Home</span>
              </Link>
              <Link 
                className={`navbar-mobile-link ${isActive('/restaurants') ? 'active' : ''}`} 
                to="/restaurants"
                onClick={closeMobileMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 4V8H4V4H8ZM10 4H14V8H10V4ZM16 4H20V8H16V4ZM8 10V14H4V10H8ZM14 10H10V14H14V10ZM16 10H20V14H16V10ZM8 16V20H4V16H8ZM10 16H14V20H10V16ZM20 16V20H16V16H20Z" fill="currentColor"/>
                </svg>
                <span>Restaurants</span>
              </Link>
              <Link 
                className={`navbar-mobile-link ${isActive('/mart-items') ? 'active' : ''}`} 
                to="/mart-items"
                onClick={closeMobileMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4V2H17V4H20.007C20.555 4 21 4.445 21 4.993V21.007C21 21.555 20.555 22 20.007 22H3.993C3.445 22 3 21.555 3 21.007V4.993C3 4.445 3.445 4 3.993 4H7ZM7 6H5V20H19V6H17V8H7V6Z" fill="currentColor"/>
                </svg>
                <span>Mart Items</span>
              </Link>
              <Link 
                className={`navbar-mobile-link ${isActive('/cart') ? 'active' : ''}`} 
                to="/cart"
                onClick={closeMobileMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 4V2H17V4H20.007C20.555 4 21 4.445 21 4.993V21.007C21 21.555 20.555 22 20.007 22H3.993C3.445 22 3 21.555 3 21.007V4.993C3 4.445 3.445 4 3.993 4H7Z" fill="currentColor"/>
                </svg>
                <span>Cart</span>
                {cartItemCount > 0 && (
                  <span className="navbar-mobile-badge">{cartItemCount}</span>
                )}
              </Link>
              <Link 
                className={`navbar-mobile-link ${isActive('/checkout') ? 'active' : ''}`} 
                to="/checkout"
                onClick={closeMobileMenu}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V12H20V18ZM20 8H4V6H20V8Z" fill="currentColor"/>
                </svg>
                <span>Checkout</span>
              </Link>

              {isSuperAdmin() && (
                <Link 
                  className={`navbar-mobile-link ${isActive('/super-admin') ? 'active' : ''}`} 
                  to="/super-admin"
                  onClick={closeMobileMenu}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                    <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                  </svg>
                  <span>Super Admin</span>
                </Link>
              )}
              {isCampusAdmin() && (
                <Link 
                  className={`navbar-mobile-link ${isActive(`/admin/${userData?.universityId}/${userData?.campusId}`) ? 'active' : ''}`} 
                  to={`/admin/${userData?.universityId}/${userData?.campusId}`}
                  onClick={closeMobileMenu}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"/>
                    <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
                  </svg>
                  <span>Campus Admin</span>
                </Link>
              )}
              {isRestaurantManager() && (
                <Link 
                  className={`navbar-mobile-link ${isActive('/restaurant-manager') ? 'active' : ''}`} 
                  to="/restaurant-manager"
                  onClick={closeMobileMenu}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM18 20H6V4H18V20Z" fill="currentColor"/>
                    <path d="M12 6H8V9H12V6Z" fill="currentColor"/>
                    <path d="M16 6H14V18H16V6Z" fill="currentColor"/>
                    <path d="M12 10H8V18H12V10Z" fill="currentColor"/>
                  </svg>
                  <span>Restaurant Manager</span>
                </Link>
              )}
            </div>

            <div className="navbar-mobile-footer">
              <div className="navbar-mobile-university">
                <UniversitySelector />
              </div>

              {/* Theme Toggle in Mobile */}
              <div className="navbar-mobile-theme">
                <ThemeToggle />
              </div>
              
              {user ? (
                <>
                  <div className="navbar-mobile-user">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    <div>
                      <p className="navbar-mobile-user-email">{user.email}</p>
                      <span className="navbar-mobile-user-role">
                        {userData?.role === "superAdmin" ? "Super Admin" : 
                         userData?.role === "campusAdmin" ? "Campus Admin" : 
                         "User"}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="navbar-mobile-signout"
                    onClick={handleSignOut}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 5H12V3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H12V19H4V5Z" fill="currentColor"/>
                    </svg>
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="navbar-mobile-auth">
                  <Link className="navbar-mobile-auth-link" to="/login" onClick={closeMobileMenu}>Sign In</Link>
                  <Link className="navbar-mobile-auth-button" to="/signup" onClick={closeMobileMenu}>Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
}

export default Navbar;

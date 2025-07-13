import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import UniversitySelector from "./UniversitySelector";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const { user, userData, isSuperAdmin, isCampusAdmin } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle dropdown open/close to prevent body scroll
  useEffect(() => {
    const handleDropdownToggle = (event) => {
      const dropdown = event.target.closest('.dropdown');
      if (dropdown) {
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');
        if (dropdownMenu) {
          const isOpen = dropdownMenu.classList.contains('show');
          
          if (isOpen) {
            document.body.classList.add('dropdown-open');
          } else {
            document.body.classList.remove('dropdown-open');
          }
        }
      }
    };

    // Handle clicking outside dropdown to close it
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('.dropdown');
      if (!dropdown) {
        // Click was outside dropdown, close any open dropdowns
        const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
        openDropdowns.forEach(dropdownMenu => {
          const dropdownToggle = dropdownMenu.previousElementSibling;
          if (dropdownToggle && dropdownToggle.classList.contains('dropdown-toggle')) {
            // Trigger Bootstrap dropdown hide
            const bsDropdown = new bootstrap.Dropdown(dropdownToggle);
            bsDropdown.hide();
          }
        });
        document.body.classList.remove('dropdown-open');
      }
    };

    // Listen for dropdown show/hide events
    document.addEventListener('show.bs.dropdown', handleDropdownToggle);
    document.addEventListener('hide.bs.dropdown', handleDropdownToggle);
    
    // Listen for clicks outside dropdown
    document.addEventListener('click', handleClickOutside);

    // Cleanup function
    return () => {
      document.removeEventListener('show.bs.dropdown', handleDropdownToggle);
      document.removeEventListener('hide.bs.dropdown', handleDropdownToggle);
      document.removeEventListener('click', handleClickOutside);
      document.body.classList.remove('dropdown-open');
    };
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="Hungry Boys" className="logo-img" />
          <span className="ms-2 logo-text ">Hungry Boys</span>
        </Link>
        
        {/* University Selector */}
        <div className="me-3">
          <UniversitySelector />
        </div>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <ul className="navbar-nav text-white">
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/restaurants">Restaurants</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/mart-items">Mart Items</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/cart">Cart</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/checkout">Checkout</Link>
            </li>
            
            {/* Admin Links based on role */}
            {isSuperAdmin() && (
              <li className="nav-item">
                <Link className="nav-link fw-bold text-white" to="/super-admin">Super Admin</Link>
              </li>
            )}
            {isCampusAdmin() && (
              <li className="nav-item">
                <Link 
                  className="nav-link fw-bold text-white" 
                  to={`/admin/${userData?.universityId}/${userData?.campusId}`}
                >
                  Campus Admin
                </Link>
              </li>
            )}
          </ul>
          
          {/* Auth Links */}
          <ul className="navbar-nav ms-auto">
            {user ? (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle fw-bold text-white" 
                  href="#" 
                  role="button" 
                  data-bs-toggle="dropdown"
                >
                  {user.email}
                </a>
                <ul className="dropdown-menu dropdown-menu-dark">
                  <li>
                    <span className="dropdown-item-text">
                      <small className="text-muted">
                        {userData?.role === "superAdmin" ? "Super Admin" : 
                         userData?.role === "campusAdmin" ? "Campus Admin" : 
                         "User"}
                      </small>
                    </span>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button 
                      className="dropdown-item" 
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-white" to="/login">Sign In</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link fw-bold text-white" to="/signup">Sign Up</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

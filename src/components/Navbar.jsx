import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="Hungry Boys" className="logo-img" />
          <span className="ms-2 logo-text ">Hungry Boys</span>
        </Link>
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
              <Link className="nav-link fw-bold text-white" to="/cart">Cart</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/checkout">Checkout</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link fw-bold text-white" to="/admin">Admin</Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

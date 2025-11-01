import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/Login.css";
import logo from "../assets/logo.png";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const navigate = useNavigate();
  
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }
    
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user data from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Role-based redirects
        if (userData.role === "superAdmin") {
          navigate("/super-admin");
        } else if (userData.role === "campusAdmin") {
          navigate(`/admin/${userData.universityId}/${userData.campusId}`);
        } else if (userData.role === "restaurantManager") {
          navigate("/home"); // Restaurant managers use the home page
        } else if (userData.role === "user") {
          navigate("/home");
        } else {
          setError("Invalid user role. Please contact support.");
        }
      } else {
        setError("User profile not found. Please contact support.");
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle specific Firebase Auth errors
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/invalid-login-credentials'
      ) {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address. Please enter a valid email.");
      } else if (err.code === 'auth/user-disabled') {
        setError("This account has been disabled. Please contact support.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        const handledError = handleError(err, 'Login - signIn');
        setError(handledError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!resetEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      console.log('Sending password reset email to:', resetEmail);
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess("Password reset email sent! Please check your inbox and spam folder.");
      setResetEmail("");
      setRecaptchaToken("");
    } catch (err) {
      console.error("Password reset error:", err);
      
      // Handle specific Firebase Auth errors
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email address. Please check your email or sign up for a new account.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address. Please enter a valid email.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Too many password reset attempts. Please try again later.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection and try again.");
      } else {
        const handledError = handleError(err, 'Login - passwordReset');
        setError(handledError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Illustration/Branding */}
        <div className="auth-side-panel">
          <div className="auth-branding">
            <div className="auth-logo-container">
              <img 
                src={logo} 
                alt="Hungry Boys Logo" 
                className="auth-logo-icon"
              />
              <h1 className="auth-logo-text">Hungry Boys</h1>
            </div>
            <p className="auth-tagline">Your cravings, delivered fresh to your campus</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <div>
                  <h4>Fast Delivery</h4>
                  <p>Get your food delivered quickly within campus</p>
                </div>
              </div>
              <div className="auth-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 2v7c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2M7 2v20M17 2v20" />
                  <path d="M21 12H3" />
                </svg>
                <div>
                  <h4>Multiple Restaurants</h4>
                  <p>Choose from a variety of campus restaurants</p>
                </div>
              </div>
              <div className="auth-feature">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <div>
                  <h4>Easy Ordering</h4>
                  <p>Simple and intuitive ordering process</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h2>{showForgotPassword ? "Reset Password" : "Welcome Back!"}</h2>
              <p>{showForgotPassword ? "Enter your email to receive a password reset link" : "Sign in to continue to Hungry Boys"}</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="auth-alert auth-alert-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{success}</span>
              </div>
            )}
            
            {loading && (
              <div className="auth-loading">
                <LoadingSpinner message={showForgotPassword ? "Sending..." : "Signing In..."} />
              </div>
            )}

            {!showForgotPassword ? (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="loginEmail">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="auth-input"
                    id="loginEmail"
                    placeholder="Enter your email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="auth-form-group">
                  <label className="auth-label" htmlFor="loginPassword">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Password
                  </label>
                  <input
                    type="password"
                    className="auth-input"
                    id="loginPassword"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="auth-recaptcha">
                  <ReCAPTCHA
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Sign In"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setRecaptchaToken("");
                  }}
                  disabled={loading}
                >
                  Forgot Password?
                </button>

                <div className="auth-divider">
                  <span>or</span>
                </div>

                <div className="auth-footer-text">
                  Don't have an account?{" "}
                  <button 
                    type="button" 
                    className="auth-text-link"
                    onClick={() => navigate("/signup")}
                  >
                    Create Account
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="auth-form">
                <div className="auth-form-group">
                  <label className="auth-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="Enter your email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                <div className="auth-recaptcha">
                  <ReCAPTCHA
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setRecaptchaToken(token)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Email"}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>

                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setRecaptchaToken("");
                  }}
                  disabled={loading}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  Back to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

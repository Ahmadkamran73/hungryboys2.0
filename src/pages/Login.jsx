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
    <div className="auth-page-centered">
      <div className="auth-container-centered">
        {/* Logo and Branding */}
        <div className="auth-header-centered">
          <div className="auth-logo-container-centered">
            <img 
              src={logo} 
              alt="Hungry Boys Logo" 
              className="auth-logo-icon-centered"
            />
          </div>
          <h1 className="auth-title-centered">Hungry Boys</h1>
          <p className="auth-welcome-centered">
            {showForgotPassword ? "Reset your password" : "Welcome back! Sign in to your account"}
          </p>
        </div>

        {/* Form Section */}
        <div className="auth-form-content-centered">
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
  );
}

export default Login;

import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/Login.css";

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
        } else if (userData.role === "user") {
          navigate("/home");
        } else {
          setError("Invalid user role. Please contact support.");
        }
      } else {
        setError("User profile not found. Please contact support.");
      }
    } catch (err) {
      const handledError = handleError(err, 'Login - signIn');
      setError(handledError.message);
      console.error("Login error:", handledError);
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

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess("Password reset email sent! Please check your inbox.");
      setResetEmail("");
    } catch (err) {
      const handledError = handleError(err, 'Login - passwordReset');
      setError(handledError.message);
      console.error("Password reset error:", handledError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="login-card">
              <h2 className="text-center mb-4">
                {showForgotPassword ? "🔑 Reset Password" : "🔒 Sign In"}
              </h2>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              {loading && (
                <div className="text-center mb-3">
                  <LoadingSpinner message="Signing In..." />
                </div>
              )}

              {!showForgotPassword ? (
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter your password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="mb-3 d-flex justify-content-center">
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={(token) => setRecaptchaToken(token)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setRecaptchaToken("");
                      }}
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <hr className="my-4" />

                  <div className="text-center">
                    <p className="mb-0">
                      Don't have an account?{" "}
                      <button 
                        type="button" 
                        className="btn btn-link p-0"
                        onClick={() => navigate("/signup")}
                      >
                        Create Account
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <p className="text-muted">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="mb-3 d-flex justify-content-center">
                    <ReCAPTCHA
                      sitekey={recaptchaSiteKey}
                      onChange={(token) => setRecaptchaToken(token)}
                    />
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 mb-3"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Email"}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setRecaptchaToken("");
                      }}
                      disabled={loading}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

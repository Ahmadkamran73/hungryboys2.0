import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useUniversity } from "../context/UniversityContext";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import "../styles/Signup.css";

function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    selectedUniversity: "",
    selectedCampus: ""
  });
  const [availableUniversities, setAvailableUniversities] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);
  const [availableDomains, setAvailableDomains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const navigate = useNavigate();
  const { selectedUniversity, selectedCampus } = useUniversity();
  
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Fetch available universities and campuses from MongoDB API
  useEffect(() => {
    const fetchUniversitiesAndCampuses = async () => {
      try {
        // Fetch universities from MongoDB API
        const universitiesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/universities`);
        if (!universitiesResponse.ok) {
          throw new Error('Failed to fetch universities');
        }
        const universities = await universitiesResponse.json();
        setAvailableUniversities(universities);

        // Fetch all campuses from MongoDB API
        const campusesResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/campuses`);
        if (!campusesResponse.ok) {
          throw new Error('Failed to fetch campuses');
        }
        const campuses = await campusesResponse.json();
        
        // Enhance campuses with university names
        const enhancedCampuses = campuses.map(campus => {
          const university = universities.find(u => u.id === campus.universityId);
          return {
            ...campus,
            universityName: university?.name || 'Unknown University'
          };
        });
        setAvailableCampuses(enhancedCampuses);

        // Note: allowedDomains still uses Firestore as it's not in MongoDB yet
        // You may want to migrate this to MongoDB later
        try {
          const domainsRef = collection(db, "allowedDomains");
          const domainsSnapshot = await getDocs(domainsRef);
          const domains = domainsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAvailableDomains(domains);
        } catch (domainError) {
          console.warn('Could not fetch allowed domains from Firestore:', domainError);
          // Set empty array as fallback
          setAvailableDomains([]);
        }
      } catch (error) {
        const handledError = handleError(error, 'Signup - fetchUniversitiesAndCampuses');
        console.error("Error fetching universities and campuses:", handledError);
      }
    };

    fetchUniversitiesAndCampuses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateEmail = (email) => {
    // Check if email matches any allowed domain for the selected campus
    const selectedCampus = availableCampuses.find(c => c.id === formData.selectedCampus);
    if (!selectedCampus) return false;
    
    // If no domains are configured, allow any email (backward compatibility)
    if (!availableDomains || availableDomains.length === 0) {
      console.log('No domain restrictions configured - allowing all emails');
      return true;
    }
    
    // Fetch domains for this campus
    const campusDomains = availableDomains.filter(d => 
      d.universityId === selectedCampus.universityId && d.campusId === selectedCampus.id
    );
    
    // If no specific domains for this campus, allow any email
    if (campusDomains.length === 0) {
      console.log('No domain restrictions for this campus - allowing all emails');
      return true;
    }
    
    return campusDomains.some(domain => email.endsWith(domain.domain));
  };

  const checkEmailExists = async (email) => {
    try {
      console.log('Checking if email exists:', email);
      
      // Check in Firestore users collection
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      
      const existsInFirestore = !querySnapshot.empty;
      console.log('Email exists in Firestore:', existsInFirestore);
      
      // Also check if email is already registered in Firebase Auth
      // We can't directly check Firebase Auth, but we can catch the error during signup
      return existsInFirestore;
    } catch (error) {
      const handledError = handleError(error, 'Signup - checkEmailExists');
      console.error("Error checking email:", handledError);
      // If there's an error checking, assume it doesn't exist to allow signup attempt
      return false;
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.selectedUniversity || !formData.selectedCampus) {
      setError("Please select a university and campus.");
      return;
    }

    if (!validateEmail(formData.email)) {
      const selectedCampus = availableCampuses.find(c => c.id === formData.selectedCampus);
      const campusDomains = availableDomains.filter(d => 
        d.universityId === selectedCampus?.universityId && d.campusId === selectedCampus?.id
      );
      
      if (campusDomains.length > 0) {
        const domainList = campusDomains.map(d => d.domain).join(", ");
        setError(`Email must end with one of the allowed domains for this campus: ${domainList}`);
      } else {
        setError("Invalid email address. Please check and try again.");
      }
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!recaptchaToken) {
      setError("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);

    try {
      // Check if email already exists
      const emailExists = await checkEmailExists(formData.email);
      if (emailExists) {
        setError("An account with this email already exists.");
        setLoading(false);
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.password
      );

      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Get selected university and campus data
      const selectedUni = availableUniversities.find(u => u.id === formData.selectedUniversity);
      const selectedCam = availableCampuses.find(c => c.id === formData.selectedCampus);

      // Store user data in Firestore
      const userData = {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        universityId: selectedUni.id,
        campusId: selectedCam.id,
        universityName: selectedUni.name,
        campusName: selectedCam.name,
        role: "user",
        createdAt: new Date().toISOString(),
        emailVerified: false
      };

      await setDoc(doc(db, "users", user.uid), userData);

      setSuccess("Account created successfully! Please check your email to verify your account. You will be redirected to the login page to sign in.");
      
      // Sign out the user so they can properly log in
      await signOut(auth);
      
      // Clear form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        selectedUniversity: "",
        selectedCampus: ""
      });
      setRecaptchaToken("");

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);

    } catch (error) {
      console.error("Signup error:", error);
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please use a different email or try logging in.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (error.code === 'auth/invalid-email') {
        setError("Invalid email address. Please enter a valid email.");
      } else if (error.code === 'auth/operation-not-allowed') {
        setError("Email/password accounts are not enabled. Please contact support.");
      } else {
        const handledError = handleError(error, 'Signup - createAccount');
        setError(handledError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Left Side - Branding Panel */}
        <div className="auth-side-panel">
          <div className="auth-side-content">
            <div className="auth-logo-container">
              <img 
                src="/logo.png" 
                alt="Hungry Boys Logo" 
                className="auth-logo-icon"
              />
              <h1 className="auth-logo-text">Hungry Boys</h1>
            </div>
            <p className="auth-tagline">Your cravings, delivered fresh to your campus</p>
            
            <div className="auth-features">
              <div className="auth-feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="white" />
                </svg>
                <div>
                  <h4>Fast Delivery</h4>
                  <p>Get your food delivered in minutes</p>
                </div>
              </div>
              
              <div className="auth-feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L12 3L21 12H18V20H15V14H9V20H6V12H3Z" fill="white" />
                </svg>
                <div>
                  <h4>Multiple Restaurants</h4>
                  <p>Choose from a variety of cuisines</p>
                </div>
              </div>
              
              <div className="auth-feature">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 1V8H15V1H17V8H19C20.11 8 21 8.9 21 10V12C21 13.11 20.11 14 19 14H5C3.9 14 3 13.11 3 12V10C3 8.9 3.9 8 5 8H7V1H9ZM7 16H9V23H7V16ZM15 16H17V23H15V16Z" fill="white" />
                </svg>
                <div>
                  <h4>Easy Ordering</h4>
                  <p>Simple and quick ordering process</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form Panel */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h2>Create Account</h2>
              <p>Join thousands of students ordering delicious food</p>
            </div>

            {availableUniversities.length === 0 && (
              <div className="auth-alert auth-alert-warning">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 22H22L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M12 9V13" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="17" r="1" fill="currentColor"/>
                </svg>
                <div>
                  <strong>No universities available</strong>
                  <p>Please contact the administrator to set up universities and campuses.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="auth-alert auth-alert-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-alert auth-alert-success">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>{success}</span>
              </div>
            )}

            {loading && (
              <div className="auth-loading">
                <LoadingSpinner message="Creating Account..." />
              </div>
            )}

            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    First Name
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="auth-input"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="auth-form-row">
                <div className="auth-form-group">
                  <label className="auth-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor"/>
                    </svg>
                    University
                  </label>
                  <select
                    className="auth-input"
                    name="selectedUniversity"
                    value={formData.selectedUniversity}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        selectedUniversity: e.target.value,
                        selectedCampus: ""
                      });
                    }}
                    required
                  >
                    <option value="">Select University</option>
                    {availableUniversities.map(university => (
                      <option key={university.id} value={university.id}>
                        {university.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 12L12 3L21 12H18V20H15V14H9V20H6V12H3Z" fill="currentColor"/>
                    </svg>
                    Campus
                  </label>
                  <select
                    className="auth-input"
                    name="selectedCampus"
                    value={formData.selectedCampus}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.selectedUniversity}
                  >
                    <option value="">Select Campus</option>
                    {formData.selectedUniversity && availableCampuses
                      .filter(campus => campus.universityId === formData.selectedUniversity)
                      .map(campus => (
                        <option key={campus.id} value={campus.id}>
                          {campus.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="currentColor"/>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  className="auth-input"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@university.edu"
                  required
                />
                {formData.selectedCampus && formData.email && !validateEmail(formData.email) && (
                  <span className="auth-input-error">
                    Email must use an allowed domain for this campus
                  </span>
                )}
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM9 8V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9Z" fill="currentColor"/>
                  </svg>
                  Password
                </label>
                <input
                  type="password"
                  className="auth-input"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM9 8V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8H9Z" fill="currentColor"/>
                  </svg>
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="auth-input"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <span className="auth-input-error">
                    Passwords do not match
                  </span>
                )}
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
                disabled={loading || !formData.selectedUniversity || !formData.selectedCampus}
              >
                <span>{loading ? "Creating Account..." : "Create Account"}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="auth-footer-text">
                Already have an account?{" "}
                <button 
                  type="button" 
                  className="auth-link-btn"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup; 
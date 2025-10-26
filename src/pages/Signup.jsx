import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useUniversity } from "../context/UniversityContext";
import ReCAPTCHA from "react-google-recaptcha";
import LoadingSpinner from "../components/LoadingSpinner";
import { handleError } from "../utils/errorHandler";
import { api } from "../utils/api";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const navigate = useNavigate();
  const { selectedUniversity, selectedCampus } = useUniversity();
  
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Fetch available universities and campuses from backend (MongoDB)
  useEffect(() => {
    const fetchUniversitiesAndCampuses = async () => {
      try {
        // Universities
        const uniRes = await api.get('/api/universities');
        const universities = Array.isArray(uniRes.data) ? uniRes.data : [];
        setAvailableUniversities(universities);

        // Campuses (fetch all once and filter by university client-side)
        const campusRes = await api.get('/api/campuses');
        const campuses = Array.isArray(campusRes.data) ? campusRes.data : [];
        setAvailableCampuses(campuses);
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
    // Only allow Gmail addresses
    return email.toLowerCase().endsWith('@gmail.com');
  };

  // Skip Firestore pre-checks to avoid permission errors; rely on Firebase Auth
  const checkEmailExists = async (_email) => {
    return false;
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
      setError("Please use a Gmail address (@gmail.com) to sign up.");
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
      // Skip Firestore pre-check; rely on Firebase Auth to throw auth/email-already-in-use

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
    <div className="signup-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="signup-card">
              <h2 className="text-center mb-4">Create Account</h2>
              
              {availableUniversities.length === 0 ? (
                <div className="alert alert-warning text-center">
                  <strong>No universities are currently available for registration.</strong>
                  <br />
                  <p className="mb-0">Please contact the administrator to set up universities and campuses.</p>
                </div>
              ) : (
                <div className="alert alert-info text-center mb-4">
                  <strong>Select your university and campus to get started</strong>
                </div>
              )}

              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}
              
              {loading && (
                <div className="text-center mb-3">
                  <LoadingSpinner message="Creating Account..." />
                </div>
              )}

              <form onSubmit={handleSignup}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">University</label>
                    <select
                      className="form-select"
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Campus</label>
                    <select
                      className="form-select"
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

                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your Gmail address"
                    required
                  />
                  {formData.email && !validateEmail(formData.email) && (
                    <div className="text-danger small mt-1">
                      Please use a Gmail address (@gmail.com)
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    required
                  />
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="text-danger small mt-1">
                      Passwords do not match
                    </div>
                  )}
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
                  disabled={loading || !formData.selectedUniversity || !formData.selectedCampus}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{" "}
                    <button 
                      type="button" 
                      className="btn btn-link p-0"
                      onClick={() => navigate("/login")}
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup; 
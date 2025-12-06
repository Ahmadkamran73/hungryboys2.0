import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { handleError } from "../utils/errorHandler";
import LoadingSpinner from "../components/LoadingSpinner";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          setError(null);
          // Fetch user data from Firestore with timeout
          const userDocRef = doc(db, "users", firebaseUser.uid);
          
          // Create a promise that rejects after 15 seconds
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Firestore timeout after 15 seconds')), 15000)
          );
          
          // Race between getDoc and timeout
          const userDoc = await Promise.race([
            getDoc(userDocRef),
            timeoutPromise
          ]);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData(null);
          }
        } catch (error) {
          // Check if it's an offline error
          if (error.code === 'unavailable' || error.message.includes('offline') || error.message.includes('timeout')) {
            console.warn('Firestore offline or timeout, continuing without user data:', error.message);
            // Don't set error state, allow app to continue
            setUserData(null);
          } else {
            const handledError = handleError(error, 'AuthContext - fetchUserData');
            setError(handledError.message);
            setUserData(null);
            console.error("Error fetching user data:", handledError);
          }
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isSuperAdmin = () => {
    return userData?.role === "superAdmin";
  };

  const isCampusAdmin = () => {
    return userData?.role === "campusAdmin";
  };

  const isRestaurantManager = () => {
    return userData?.role === "restaurantManager";
  };

  const isUser = () => {
    return userData?.role === "user";
  };

  const hasRole = (role) => {
    return userData?.role === role;
  };

  const canAccessCampus = (universityId, campusId) => {
    if (isSuperAdmin()) return true;
    if (isCampusAdmin()) {
      return userData?.universityId === universityId && userData?.campusId === campusId;
    }
    return false;
  };

  const value = {
    user,
    userData,
    loading,
    error,
    isSuperAdmin,
    isCampusAdmin,
    isRestaurantManager,
    isUser,
    hasRole,
    canAccessCampus
  };

  if (loading) {
    return <LoadingSpinner message="Loading App..." fullscreen={true} />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
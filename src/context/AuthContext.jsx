import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { handleError } from "../utils/errorHandler";

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
          // Fetch user data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            setUserData(null);
          }
        } catch (error) {
          const handledError = handleError(error, 'AuthContext - fetchUserData');
          setError(handledError.message);
          setUserData(null);
          console.error("Error fetching user data:", handledError);
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
    isUser,
    hasRole,
    canAccessCampus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
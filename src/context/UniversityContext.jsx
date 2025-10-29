import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  collection, 
  getDocs 
} from "firebase/firestore";
import { db } from "../firebase";

const UniversityContext = createContext();

export const useUniversity = () => useContext(UniversityContext);

export const UniversityProvider = ({ children }) => {
  const [universities, setUniversities] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(() => {
    const saved = localStorage.getItem("selectedUniversity");
    return saved ? JSON.parse(saved) : null;
  });
  
  const [selectedCampus, setSelectedCampus] = useState(() => {
    const saved = localStorage.getItem("selectedCampus");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  // Fetch universities from Firestore
  const fetchUniversities = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "universities"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUniversities(data);
    } catch (error) {
      console.error("Error fetching universities:", error);
    }
  };

  // Fetch campuses for a specific university
  const fetchCampuses = async (universityId) => {
    if (!universityId) {
      setCampuses([]);
      return;
    }
    
    try {
      const campusesRef = collection(db, "universities", universityId, "campuses");
      const querySnapshot = await getDocs(campusesRef);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        universityId,
        ...doc.data()
      }));
      setCampuses(data);
    } catch (error) {
      console.error("Error fetching campuses:", error);
      setCampuses([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUniversities();
      setLoading(false);
    };
    loadData();
  }, []);

  // Load campuses when university is selected
  useEffect(() => {
    if (selectedUniversity) {
      fetchCampuses(selectedUniversity.id);
    } else {
      setCampuses([]);
    }
  }, [selectedUniversity]);

  // Save selections to localStorage
  useEffect(() => {
    if (selectedUniversity) {
      localStorage.setItem("selectedUniversity", JSON.stringify(selectedUniversity));
    } else {
      localStorage.removeItem("selectedUniversity");
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedCampus) {
      localStorage.setItem("selectedCampus", JSON.stringify(selectedCampus));
    } else {
      localStorage.removeItem("selectedCampus");
    }
  }, [selectedCampus]);

  const value = {
    universities,
    campuses,
    selectedUniversity,
    selectedCampus,
    setSelectedUniversity,
    setSelectedCampus,
    loading
  };

  return (
    <UniversityContext.Provider value={value}>
      {children}
    </UniversityContext.Provider>
  );
}; 
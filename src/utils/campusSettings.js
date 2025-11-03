import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Fetch campus settings for a specific campus
 * @param {string} universityId - University ID
 * @param {string} campusId - Campus ID
 * @param {boolean} forceRefresh - Force refresh from server (bypass cache)
 * @returns {Promise<Object>} Campus settings object
 */
export const fetchCampusSettings = async (universityId, campusId, forceRefresh = false) => {
  try {
    const settingsRef = doc(db, "universities", universityId, "campuses", campusId, "settings", "payment");
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    } else {
      // Return default settings if none exist
      return {
        deliveryChargePerPerson: 150,
        accountTitle: "Maratib Ali",
        bankName: "Habib bank limited",
        accountNumber: "54427000095103"
      };
    }
  } catch (error) {
    // Silently return default settings on error (no console.error)
    return {
      deliveryChargePerPerson: 150,
      accountTitle: "Maratib Ali",
      bankName: "Habib bank limited",
      accountNumber: "54427000095103"
    };
  }
};

/**
 * Get campus settings with fallback to defaults
 * @param {Object} campus - Campus object with universityId and id
 * @returns {Promise<Object>} Campus settings object
 */
export const getCampusSettings = async (campus) => {
  if (!campus?.universityId || !campus?.id) {
    return {
      deliveryChargePerPerson: 150,
      accountTitle: "Maratib Ali",
      bankName: "Habib bank limited",
      accountNumber: "54427000095103"
    };
  }
  
  return await fetchCampusSettings(campus.universityId, campus.id);
};

export default {
  fetchCampusSettings,
  getCampusSettings
};

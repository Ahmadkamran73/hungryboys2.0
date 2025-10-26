import { api, authHeaders } from "./api";

/**
 * Fetch campus settings for a specific campus from MongoDB
 * @param {string} campusId - Campus ID
 * @param {Object} user - Firebase user object (optional, for auth)
 * @returns {Promise<Object>} Campus settings object
 */
export const fetchCampusSettings = async (campusId, user = null) => {
  try {
    const response = await api.get(`/api/campus-settings/${campusId}`, {
      headers: await authHeaders(user)
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching campus settings:', error);
    // Return default settings on error
    return {
      deliveryChargePerPerson: 150,
      accountTitle: "Maratib Ali",
      bankName: "SadaPay",
      accountNumber: "03330374616"
    };
  }
};

/**
 * Get campus settings with fallback to defaults
 * @param {Object} campus - Campus object with id
 * @param {Object} user - Firebase user object (optional, for auth)
 * @returns {Promise<Object>} Campus settings object
 */
export const getCampusSettings = async (campus, user = null) => {
  if (!campus?.id) {
    return {
      deliveryChargePerPerson: 150,
      accountTitle: "Maratib Ali",
      bankName: "SadaPay",
      accountNumber: "03330374616"
    };
  }
  
  return await fetchCampusSettings(campus.id, user);
};

export default {
  fetchCampusSettings,
  getCampusSettings
};

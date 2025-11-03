import { api, authHeaders } from "./api";

/**
 * Fetch campus settings for a specific campus
 * @param {string} universityId - University ID
 * @param {string} campusId - Campus ID
 * @param {boolean} forceRefresh - Force refresh from server (bypass cache)
 * @returns {Promise<Object>} Campus settings object
 */
/**
 * Fetch campus settings for a specific campus.
 * Prefer the backend (MongoDB) endpoint when available. If a `user` is
 * provided the request will include auth headers. On any failure we fall
 * back to the Firestore document (preserve previous behaviour) and finally
 * to sensible defaults.
 *
 * @param {string} universityId
 * @param {string} campusId
 * @param {boolean} forceRefresh
 * @param {Object} user - optional Firebase user used to build auth headers
 */
export const fetchCampusSettings = async (universityId, campusId, forceRefresh = false, user = null) => {
  // Fetch campus settings from the backend (MongoDB). If auth `user` is
  // provided we'll include the Firebase token in the Authorization header.
  try {
    if (!campusId) throw new Error('campusId required');
    const headers = user ? await authHeaders(user) : {};
    const res = await api.get(`/api/campus-settings/${campusId}`, { headers });
    if (res && res.data) {
      return res.data;
    }
  } catch (err) {
  // On error we return defaults (keep checkout resilient)
    // On failure return defaults — keep checkout resilient.
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
/**
 * Convenience wrapper used by components. Accepts an optional `user` so callers
 * can include auth for backend requests. If no user is supplied the function
 * will attempt the backend without auth and then fall back to Firestore.
 */
export const getCampusSettings = async (campus, user = null) => {
  if (!campus?.universityId || !campus?.id) {
    return {
      deliveryChargePerPerson: 150,
      accountTitle: "Maratib Ali",
      bankName: "Habib bank limited",
      accountNumber: "54427000095103"
    };
  }
  
  return await fetchCampusSettings(campus.universityId, campus.id, false, user);
};

export default {
  fetchCampusSettings,
  getCampusSettings
};

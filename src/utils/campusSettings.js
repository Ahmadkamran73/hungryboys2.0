import { api, authHeaders } from "./api";

/**
 * Fetch campus settings for a specific campus.
 * Prefer the backend (MongoDB) endpoint when available. If a `user` is
 * provided the request will include auth headers. On any failure we fall
 * back to sensible defaults (backend will return global delivery fee).
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
    console.error('Error fetching campus settings:', err);
  }
  
  // Fallback to default values (will use global delivery fee from backend)
  return {
    accountTitle: "Maratib Ali",
    bankName: "Habib bank limited",
    accountNumber: "54427000095103"
  };
};

/**
 * Convenience wrapper used by components. Accepts an optional `user` so callers
 * can include auth for backend requests. If no user is supplied the function
 * will attempt the backend without auth.
 */
export const getCampusSettings = async (campus, user = null) => {
  if (!campus?.universityId || !campus?.id) {
    return {
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

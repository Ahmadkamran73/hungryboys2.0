/**
 * Utility function to check if a restaurant is currently open
 * @param {Object} restaurant - Restaurant document with timing fields
 * @param {string} restaurant.openTime - Opening time in "hh:mm AM/PM" format
 * @param {string} restaurant.closeTime - Closing time in "hh:mm AM/PM" format
 * @param {boolean} restaurant.is24x7 - Whether restaurant is open 24/7
 * @returns {boolean} - true if restaurant is open, false if closed
 */
export function isRestaurantOpen(restaurant) {
  // If restaurant is 24/7, always return true
  if (restaurant.is24x7 === true) {
    return true;
  }

  // If timing fields are missing, treat as 24/7 (backward compatibility)
  if (!restaurant.openTime || !restaurant.closeTime) {
    return true;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes since midnight

  // Parse opening time
  const openTimeMinutes = parseTimeToMinutes(restaurant.openTime);
  // Parse closing time
  const closeTimeMinutes = parseTimeToMinutes(restaurant.closeTime);

  // Handle overnight hours (e.g., 8:00 PM → 2:00 AM)
  if (closeTimeMinutes < openTimeMinutes) {
    // Restaurant closes the next day
    return currentTime >= openTimeMinutes || currentTime < closeTimeMinutes;
  } else {
    // Restaurant closes the same day
    return currentTime >= openTimeMinutes && currentTime < closeTimeMinutes;
  }
}

/**
 * Parse time string in "hh:mm AM/PM" format to minutes since midnight
 * @param {string} timeString - Time in "hh:mm AM/PM" format
 * @returns {number} - Minutes since midnight
 */
function parseTimeToMinutes(timeString) {
  const [time, period] = timeString.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  
  // Handle AM/PM
  if (period === 'AM') {
    // 12:00 AM = 0:00 (midnight)
    if (hours === 12) {
      totalMinutes = minutes;
    }
  } else if (period === 'PM') {
    // 12:00 PM = 12:00 (noon)
    if (hours !== 12) {
      totalMinutes = (hours + 12) * 60 + minutes;
    }
  }
  
  return totalMinutes;
}

/**
 * Format time for display (e.g., "10:00 AM")
 * @param {string} timeString - Time in "hh:mm AM/PM" format
 * @returns {string} - Formatted time string
 */
export function formatTimeForDisplay(timeString) {
  if (!timeString) return '';
  return timeString;
}

/**
 * Get next opening time for display
 * @param {Object} restaurant - Restaurant document
 * @returns {string} - Next opening time or empty string if 24/7
 */
export function getNextOpeningTime(restaurant) {
  if (restaurant.is24x7 === true) {
    return '';
  }
  return restaurant.openTime || '';
}

/**
 * Get next closing time for display
 * @param {Object} restaurant - Restaurant document
 * @returns {string} - Next closing time or empty string if 24/7
 */
export function getNextClosingTime(restaurant) {
  if (restaurant.is24x7 === true) {
    return '';
  }
  return restaurant.closeTime || '';
}

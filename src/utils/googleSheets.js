// Google Sheets API utilities for campus-specific order management
import axios from 'axios';

// Backend API configuration
const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';



// Check if backend is configured
const isBackendConfigured = () => {
  if (!BACKEND_BASE_URL) {
    console.warn('Backend not configured: VITE_BACKEND_URL is missing');
    return false;
  }
  return true;
};

// Enhanced error handling for API responses
const handleAPIError = (error, operation) => {
  console.error(`Error in ${operation}:`, error);
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        throw new Error(`Bad request: ${data.error || 'Invalid request parameters'}`);
      case 401:
        throw new Error(`Unauthorized: Backend authentication failed. Please check your backend configuration.`);
      case 403:
        throw new Error(`Forbidden: Access denied. Please ensure the backend has proper permissions.`);
      case 404:
        throw new Error(`Not found: The requested resource was not found.`);
      case 429:
        throw new Error(`Rate limit exceeded: Please wait before making more requests.`);
      case 500:
        throw new Error(`Backend error: ${data.error || 'Internal server error'}`);
      default:
        throw new Error(`API error (${status}): ${data.error || 'Unknown error'}`);
    }
  } else if (error.request) {
    throw new Error(`Network error: Unable to connect to backend. Please check if the backend server is running.`);
  } else {
    throw new Error(`Configuration error: ${error.message}`);
  }
};

// Helper function to throw configuration error
const throwConfigError = () => {
  throw new Error(
    'Backend not configured. Please set the following environment variable:\n' +
    'VITE_BACKEND_URL=your_backend_url\n\n' +
    'Default: http://localhost:4000'
  );
};

// Column headers for order sheets
const ORDER_COLUMNS = [
  'universityName',
  'campusName', 
  'firstName',
  'lastName',
  'room',
  'phone',
  'email',
  'gender',
  'persons',
  'deliveryCharge',
  'itemTotal',
  'grandTotal',
  'cartItems',
  'timestamp',
  'accountTitle',
  'bankName',
  'screenshotURL',
  'Special Instructions',
  'maleOrders',
  'maleOrderDetails',
  'femaleOrders',
  'femaleOrderDetails'
];

/**
 * Sanitize tab name for Google Sheets
 * @param {string} name - The name to sanitize
 * @returns {string} - Sanitized name
 */
export const sanitizeTabName = (name) => {
  return name
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 30); // Limit to 30 characters (Google Sheets limit)
};

/**
 * Create a new tab in the Google Spreadsheet
 * @param {string} universityName - University name
 * @param {string} campusName - Campus name
 * @returns {Promise<Object>} - Response from backend API
 */
export const createSheetTab = async (universityName, campusName) => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    const response = await axios.post(
      `${BACKEND_BASE_URL}/api/sheets/create`,
      {
        universityName,
        campusName
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );


    return response.data;
  } catch (error) {
    handleAPIError(error, 'createSheetTab');
  }
};

/**
 * Recreate (or force-update) campus sheet headers using backend recreate endpoint
 * @param {string} tabName - Sanitized tab name (e.g. University_Campus)
 * @returns {Promise<Object>} - Response from backend API
 */
export const recreateCampusSheet = async (tabName) => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }

  try {
    const response = await axios.post(`${BACKEND_BASE_URL}/api/sheets/recreate-campus/${encodeURIComponent(tabName)}`);
    return response.data;
  } catch (error) {
    // If the production backend uses a different shape (e.g. expects tabName in body)
    // try a fallback: POST to /api/sheets/recreate-campus with JSON body { tabName }.
    if (error && error.response && error.response.status === 404) {
      try {
        const fallback = await axios.post(`${BACKEND_BASE_URL}/api/sheets/recreate-campus`, { tabName }, { headers: { 'Content-Type': 'application/json' } });
        return fallback.data;
      } catch (err2) {
        // If fallback also fails, surface original error handling below
        console.error('recreateCampusSheet fallback failed:', err2);
        handleAPIError(error, 'recreateCampusSheet');
      }
    } else {
      handleAPIError(error, 'recreateCampusSheet');
    }
  }
};

/**
 * Delete a tab from the Google Spreadsheet
 * @param {string} universityName - University name
 * @param {string} campusName - Campus name
 * @returns {Promise<Object>} - Response from backend API
 */
export const deleteSheetTab = async (universityName, campusName) => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    const response = await axios.delete(
      `${BACKEND_BASE_URL}/api/sheets/delete`,
      {
        data: {
          universityName,
          campusName
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );


    return response.data;
  } catch (error) {
    handleAPIError(error, 'deleteSheetTab');
  }
};

/**
 * Get all sheet tabs from the spreadsheet
 * @returns {Promise<Array>} - Array of sheet names
 */
export const getAllSheetTabs = async () => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    const response = await axios.get(`${BACKEND_BASE_URL}/api/sheets/tabs`);
    return response.data;
  } catch (error) {
    handleAPIError(error, 'getAllSheetTabs');
  }
};

/**
 * Get orders from a specific sheet
 * @param {string} sheetName - Name of the sheet
 * @param {number} maxRows - Maximum number of rows to fetch (default: 100)
 * @returns {Promise<Array>} - Array of orders
 */
export const getOrdersFromSheet = async (sheetName, maxRows = 100) => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    const response = await axios.get(
      `${BACKEND_BASE_URL}/api/sheets/orders/${encodeURIComponent(sheetName)}`,
      {
        params: { maxRows }
      }
    );

    return response.data;
  } catch (error) {
    handleAPIError(error, 'getOrdersFromSheet');
  }
};

/**
 * Check if a sheet tab exists
 * @param {string} universityName - University name
 * @param {string} campusName - Campus name
 * @returns {Promise<boolean>} - True if sheet exists
 */
export const sheetTabExists = async (universityName, campusName) => {
  if (!isBackendConfigured()) {
    return false;
  }
  
  try {
    const tabs = await getAllSheetTabs();
    const tabName = sanitizeTabName(`${universityName}_${campusName}`);
    return tabs.some(tab => tab.name === tabName);
  } catch (error) {
    console.error('Error checking if sheet exists:', error);
    return false;
  }
};

/**
 * Create master sheet if it doesn't exist
 * @returns {Promise<Object>} - Response from backend API
 */
export const createMasterSheet = async () => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    const response = await axios.post(`${BACKEND_BASE_URL}/api/sheets/master`);

    return response.data;
  } catch (error) {
    handleAPIError(error, 'createMasterSheet');
  }
};

/**
 * Submit order to the appropriate campus sheet
 * @param {Object} orderData - Order data
 * @param {string} universityName - University name
 * @param {string} campusName - Campus name
 * @returns {Promise<Object>} - Response from backend API
 */
export const submitOrderToSheet = async (orderData, universityName, campusName) => {
  if (!isBackendConfigured()) {
    throwConfigError();
  }
  
  try {
    // Prepare order data in the correct format
    const orderRow = [
      universityName,
      campusName,
      orderData.firstName,
      orderData.lastName,
      orderData.room || '',
      orderData.phone,
      orderData.email,
      orderData.gender,
      orderData.persons,
      orderData.deliveryCharge,
      orderData.itemTotal,
      orderData.grandTotal,
      orderData.cartItems,
      orderData.timestamp,
      orderData.accountTitle,
      orderData.bankName,
      orderData.screenshotURL,
      orderData.specialInstruction || ''
    ];

    // Add gender-specific columns: maleOrders, maleOrderDetails, femaleOrders, femaleOrderDetails
    // Populate the appropriate fields based on order gender so sheet columns are not left empty.
    const maleOrders = orderData.gender && String(orderData.gender).toLowerCase() === 'male' ? (orderData.persons || 1) : '';
    const maleOrderDetails = orderData.gender && String(orderData.gender).toLowerCase() === 'male' ? (orderData.cartItems || '') : '';
    const femaleOrders = orderData.gender && String(orderData.gender).toLowerCase() === 'female' ? (orderData.persons || 1) : '';
    const femaleOrderDetails = orderData.gender && String(orderData.gender).toLowerCase() === 'female' ? (orderData.cartItems || '') : '';

    orderRow.push(maleOrders, maleOrderDetails, femaleOrders, femaleOrderDetails);

    // Submit to campus-specific sheet
    const tabName = sanitizeTabName(`${universityName}_${campusName}`);
    const response = await axios.post(
      `${BACKEND_BASE_URL}/api/sheets/orders/${encodeURIComponent(tabName)}`,
      {
        values: [orderRow]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );


    return response.data;
  } catch (error) {
    handleAPIError(error, 'submitOrderToSheet');
  }
};

export default {
  createSheetTab,
  deleteSheetTab,
  submitOrderToSheet,
  getAllSheetTabs,
  getOrdersFromSheet,
  sheetTabExists,
  createMasterSheet,
  sanitizeTabName
}; 
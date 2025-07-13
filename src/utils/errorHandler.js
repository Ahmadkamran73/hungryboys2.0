// Error handling utility for consistent error messages and handling

export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN'
};

export const ErrorMessages = {
  [ErrorTypes.NETWORK]: {
    title: 'Network Error',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    action: 'Retry'
  },
  [ErrorTypes.AUTHENTICATION]: {
    title: 'Authentication Error',
    message: 'Your session has expired. Please log in again.',
    action: 'Login'
  },
  [ErrorTypes.AUTHORIZATION]: {
    title: 'Access Denied',
    message: 'You do not have permission to perform this action.',
    action: 'Go Back'
  },
  [ErrorTypes.VALIDATION]: {
    title: 'Invalid Input',
    message: 'Please check your input and try again.',
    action: 'Fix Input'
  },
  [ErrorTypes.NOT_FOUND]: {
    title: 'Not Found',
    message: 'The requested resource was not found.',
    action: 'Go Home'
  },
  [ErrorTypes.SERVER]: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    action: 'Retry'
  },
  [ErrorTypes.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry'
  }
};

// Firebase error codes mapping
export const FirebaseErrorMessages = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'permission-denied': 'You do not have permission to access this resource.',
  'unavailable': 'Service temporarily unavailable. Please try again.',
  'deadline-exceeded': 'Request timed out. Please try again.',
  'resource-exhausted': 'Service quota exceeded. Please try again later.',
  'failed-precondition': 'Operation failed due to a precondition.',
  'aborted': 'Operation was aborted. Please try again.',
  'out-of-range': 'Operation is out of valid range.',
  'unimplemented': 'Operation is not implemented.',
  'internal': 'Internal server error. Please try again.',
  'unavailable': 'Service is currently unavailable.',
  'data-loss': 'Data loss occurred. Please try again.',
  'unauthenticated': 'Authentication required. Please log in.'
};

// HTTP status code mapping
export const HttpErrorMessages = {
  400: 'Bad request. Please check your input.',
  401: 'Authentication required. Please log in.',
  403: 'Access denied. You do not have permission.',
  404: 'Resource not found.',
  408: 'Request timeout. Please try again.',
  429: 'Too many requests. Please try again later.',
  500: 'Internal server error. Please try again later.',
  502: 'Bad gateway. Please try again later.',
  503: 'Service unavailable. Please try again later.',
  504: 'Gateway timeout. Please try again later.'
};

// Main error handler function
export const handleError = (error, context = '') => {
  console.error(`Error in ${context}:`, error);

  // Determine error type
  let errorType = ErrorTypes.UNKNOWN;
  let userMessage = 'An unexpected error occurred. Please try again.';

  // Handle Firebase errors
  if (error?.code && FirebaseErrorMessages[error.code]) {
    userMessage = FirebaseErrorMessages[error.code];
    
    if (error.code.startsWith('auth/')) {
      errorType = ErrorTypes.AUTHENTICATION;
    } else if (error.code === 'permission-denied') {
      errorType = ErrorTypes.AUTHORIZATION;
    }
  }
  // Handle HTTP errors
  else if (error?.response?.status) {
    const status = error.response.status;
    userMessage = HttpErrorMessages[status] || `HTTP ${status} error occurred.`;
    
    if (status === 401) {
      errorType = ErrorTypes.AUTHENTICATION;
    } else if (status === 403) {
      errorType = ErrorTypes.AUTHORIZATION;
    } else if (status === 404) {
      errorType = ErrorTypes.NOT_FOUND;
    } else if (status >= 500) {
      errorType = ErrorTypes.SERVER;
    } else if (status === 400) {
      errorType = ErrorTypes.VALIDATION;
    }
  }
  // Handle network errors
  else if (error?.message?.includes('Network Error') || error?.code === 'NETWORK_ERROR') {
    errorType = ErrorTypes.NETWORK;
    userMessage = ErrorMessages[ErrorTypes.NETWORK].message;
  }
  // Handle validation errors
  else if (error?.message?.includes('validation') || error?.message?.includes('invalid')) {
    errorType = ErrorTypes.VALIDATION;
    userMessage = error.message || ErrorMessages[ErrorTypes.VALIDATION].message;
  }

  return {
    type: errorType,
    message: userMessage,
    originalError: error,
    context
  };
};

// Async error wrapper for try-catch blocks
export const withErrorHandling = async (asyncFunction, context = '') => {
  try {
    return await asyncFunction();
  } catch (error) {
    const handledError = handleError(error, context);
    throw handledError;
  }
};

// Error boundary error handler
export const handleBoundaryError = (error, errorInfo) => {
  console.error('Error Boundary caught error:', error, errorInfo);
  
  // You can send error to error reporting service here
  // Example: Sentry.captureException(error, { extra: errorInfo });
  
  return {
    type: ErrorTypes.UNKNOWN,
    message: 'Something went wrong. Please refresh the page and try again.',
    originalError: error,
    errorInfo
  };
};

// Validation error handler
export const handleValidationError = (errors) => {
  const errorMessages = Object.values(errors).filter(Boolean);
  return {
    type: ErrorTypes.VALIDATION,
    message: errorMessages.length > 0 ? errorMessages.join('. ') : 'Please check your input.',
    errors
  };
}; 
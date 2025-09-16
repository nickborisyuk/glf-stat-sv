// API Configuration
// This file contains API settings for different environments

// Default API configuration
const API_CONFIG = {
  development: {
    baseUrl: '/api',
    timeout: 10000,
    retries: 3
  },
  production: {
    baseUrl: 'http://your-server.com/api', // Change this to your remote server
    timeout: 15000,
    retries: 2
  },
  staging: {
    baseUrl: 'http://pleibx.com:3001/api', // Change this to your staging server
    timeout: 12000,
    retries: 3
  }
};

// Get current environment
const getEnvironment = () => {
  // Check if we're in development mode (Vite dev server)
  if (import.meta.env.DEV) {
    return 'development';
  }
  
  // Check for custom environment variable
  const env = import.meta.env.VITE_ENV || 'production';
  return env;
};

// Get API configuration for current environment
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env] || API_CONFIG.production;
};

// Export current API base URL
export const API_BASE = getApiConfig().baseUrl;

// Export other configuration
export const API_TIMEOUT = getApiConfig().timeout;
export const API_RETRIES = getApiConfig().retries;

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

// Log current configuration (only in development)
if (import.meta.env.DEV) {
  console.log('🌐 API Configuration:', {
    environment: getEnvironment(),
    baseUrl: API_BASE,
    timeout: API_TIMEOUT,
    retries: API_RETRIES
  });
}

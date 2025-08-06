/**
 * App configuration and API keys
 * Set your API keys in environment variables or use mock data for development
 */

export const CONFIG = {
  // Job Search API
  RAPIDAPI_KEY: process.env.EXPO_PUBLIC_RAPIDAPI_KEY || '',
  
  // App Settings
  DEFAULT_JOB_SEARCH: 'Software Engineer',
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  
  // API Endpoints
  RAPIDAPI_URL: 'https://jsearch.p.rapidapi.com',
  
  // Mock Data Settings
  USE_MOCK_DATA: !process.env.EXPO_PUBLIC_RAPIDAPI_KEY,
  
  // UI Settings
  REFRESH_INTERVAL: 30000, // 30 seconds
  MAX_JOBS_PER_PAGE: 100, // Increased to support more comprehensive results
  MAX_SEARCH_PAGES: 5, // Reduced from 10 to 5 pages to prevent timeouts
  SEARCH_TIMEOUT: 10000, // 10 seconds (reduced for better reliability)
  BACKGROUND_REQUEST_TIMEOUT: 8000, // 8 seconds for background requests
  REQUEST_DELAY: 300, // 300ms delay between requests
};

/**
 * Check if real API is available
 */
export const hasApiAccess = (): boolean => {
  return !!CONFIG.RAPIDAPI_KEY;
};

/**
 * Get API status for debugging
 */
export const getApiStatus = () => {
  return {
    rapidapi: !!CONFIG.RAPIDAPI_KEY,
    mockData: CONFIG.USE_MOCK_DATA,
  };
}; 
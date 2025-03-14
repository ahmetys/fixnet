// API base URL
export const API_URL = process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3000/api";

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;

// Request timeout in milliseconds
export const REQUEST_TIMEOUT = 30000;

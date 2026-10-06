/**
 * Central API configuration.
 * Set VITE_API_URL in your .env file to point at your deployed backend.
 * Falls back to localhost for local development.
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default API_BASE;

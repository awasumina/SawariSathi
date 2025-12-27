// src/config/api.js

// Production URL (Render hosting) - update this after deploying to Render
const PRODUCTION_URL = 'https://sawarisathi-backend.onrender.com';

// Local development URL
const LOCAL_IP = '192.168.1.77';
const LOCAL_URL = `http://${LOCAL_IP}:3000`;

// Toggle between production and development
const IS_PRODUCTION = true; // Set to false for local development

const BASE_URL = IS_PRODUCTION ? PRODUCTION_URL : LOCAL_URL;

// Base URL for the main application API (routes, stops, etc.)
export const API_BASE_URL = `${BASE_URL}/api`;

// Debug log to verify URL
console.log('🌐 API_BASE_URL:', API_BASE_URL);

// Base URL for the authentication API (login, register)
export const AUTH_API_BASE_URL = `${BASE_URL}/api/auth`;

// You can add other API-related constants here if needed
// export const API_TIMEOUT = 15000; // Example: 15 seconds timeout
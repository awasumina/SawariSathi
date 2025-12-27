// src/config/api.js

// Use your actual local IP address or domain name here
const LOCAL_IP = ' 192.168.1.77'; // <-- Updated to current IP

// Base URL for the main application API (routes, stops, etc.)
export const API_BASE_URL = `http://${LOCAL_IP}:3000/api`;

// Debug log to verify URL
console.log('🌐 API_BASE_URL:', API_BASE_URL);

// Base URL for the authentication API (login, register)
export const AUTH_API_BASE_URL = `http://${LOCAL_IP}:3000/api/auth`;

// You can add other API-related constants here if needed
// export const API_TIMEOUT = 15000; // Example: 15 seconds timeout
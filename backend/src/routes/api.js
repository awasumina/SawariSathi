import express from 'express';
// import listEndpoints from 'express-list-endpoints'; // Correct import syntax

import {
  getFare,
  getYatayatId,
  getStopsForRoutes,
  getVehicleImage,
  getAllStops,
  getNearbyStops,
  getRoutesFromLocation,
  getRoutesBetweenLocations,
  getWalkingDirections,
  getDrivingDirections,
  getPlacesAutocomplete,
  getPlaceDetails
} from '../controllers/routeControllers.js';
 
import {
  addStopsdb,
  getStopdb,
  deleteStopById,
  getStopId,
  updateStopId,
  addRoutesdb,
  getRoutedb,
  deleteRouteById,
  getRouteId,
  updateRouteId,
  getFaredb,
  addFaredb
} from '../controllers/dashboardController.js';

import {
  userSignup,
  userLogin,
  getUserProfile,
  updateUserProfile,
  verifyOTP,
  resendOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword
} from '../controllers/authController.js';

// Middleware
import { authMiddleware } from '../middleware/authMiddleware.js';
import { loginLimiter, signupLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply general rate limiter to all API routes
router.use(generalLimiter);

router.get('/fare', getFare);
router.get('/stops', getAllStops);
router.get('/yatayatById/:id', getYatayatId);
router.get('/routes/stops', getStopsForRoutes);
router.get('/yatayat/vehicleImage', getVehicleImage);

// New location-based routes
router.get('/routes/nearby-stops', getNearbyStops);
router.get('/routes/from-location', getRoutesFromLocation);
router.get('/routes/between-locations', getRoutesBetweenLocations);
router.get('/routes/walking-directions', getWalkingDirections);
router.get('/routes/driving-directions', getDrivingDirections);

// Google Places API routes
router.get('/places/autocomplete', getPlacesAutocomplete);
router.get('/places/details', getPlaceDetails);


//dashboard
router.post('/addStop', addStopsdb);
router.get('/getStops', getStopdb);
router.get('/getStopById/:id', getStopId);
router.put('/updateStopById/:id', updateStopId);

router.delete('/deleteStop/:id', async (req, res) => {
  const parsedId = parseInt(req.params.id, 10);
  if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  try {
      const success = await deleteStopById(parsedId);  // Call the function with parsed ID
      if (success) {
          res.status(200).json({ success: true, message: 'Stop deleted successfully' });
      } else {
          res.status(500).json({ success: false, message: 'Error deleting stop' });
      }
  } catch (err) {
      console.error("Error deleting stops:", err.message);
      res.status(500).json({ error: "Error deleting stops" });
  }
});

router.post('/addRoute', addRoutesdb);
router.get('/getRoutes', getRoutedb);
router.get('/getRouteById/:id', getRouteId);
router.put('/updateRouteById/:id', updateRouteId);


router.delete('/deleteRoute/:id', async (req, res) => {
  const parsedId = parseInt(req.params.id, 10);
  if (isNaN(parsedId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }
  try {
      const success = await deleteRouteById(parsedId);  // Call the function with parsed ID
      if (success) {
          res.status(200).json({ success: true, message: 'Route deleted successfully' });
      } else {
          res.status(500).json({ success: false, message: 'Error deleting Route' });
      }
  } catch (err) {
      console.error("Error deleting Route:", err.message);
      res.status(500).json({ error: "Error deleting Route" });
  } 
});




router.post('/addFare', addFaredb);
router.get('/getFare', getFaredb);


// ============================================
// SECURE Authentication Routes (With Rate Limiting)
// ============================================

// User Signup/Register (with rate limiting) - Sends OTP to email
router.post('/auth/signup', signupLimiter, userSignup);

// Verify OTP after signup (with rate limiting)
router.post('/auth/verify-otp', signupLimiter, verifyOTP);

// Resend OTP if user didn't receive (with rate limiting)
router.post('/auth/resend-otp', signupLimiter, resendOTP);

// User Login (with rate limiting) - Requires verified email
router.post('/auth/login', loginLimiter, userLogin);

// Forgot Password - Send reset OTP
router.post('/auth/forgot-password', signupLimiter, forgotPassword);

// Verify Reset OTP
router.post('/auth/verify-reset-otp', signupLimiter, verifyResetOTP);

// Reset Password with OTP
router.post('/auth/reset-password', signupLimiter, resetPassword);

// Get User Profile (protected with JWT)
router.get('/auth/profile/:id', authMiddleware, getUserProfile);

// Update User Profile (protected with JWT)
router.put('/auth/profile/:id', authMiddleware, updateUserProfile);


// console.log(listEndpoints(router));

export default router;
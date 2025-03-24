import express from 'express';
// import listEndpoints from 'express-list-endpoints'; // Correct import syntax

import {
  getFare, 
  getYatayatId,
  getStopsForRoutes,
  getVehicleImage  ,
  getAllStops
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

const router = express.Router();

router.get('/fare', getFare);
router.get('/stops', getAllStops);
router.get('/yatayatById/:id', getYatayatId);
router.get('/routes/stops', getStopsForRoutes);
router.get('/yatayat/vehicleImage', getVehicleImage);


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

// console.log(listEndpoints(router));

export default router;
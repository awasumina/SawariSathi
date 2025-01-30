import express from 'express';
// import listEndpoints from 'express-list-endpoints'; // Correct import syntax

import {
  getFare,
  getYatayatId,
  getStopsForRoutes,
  getVehicleImage  
} from '../controllers/routeControllers.js';

import {
  addStopsdb,
  getStopdb
} from '../controllers/dashboardController.js';

const router = express.Router();

// Define routes for children
router.get('/fare', getFare);
router.get('/routes/stops', getStopsForRoutes);
router.get('/yatayat/vehicleImage', getVehicleImage);
// router.get('/yatayat/:id', getYatayatId);

// router.post('/stops/add',addStopsdb);


router.post('/addStop', addStopsdb);
router.get('/getStops', getStopdb);


// console.log(listEndpoints(router));

export default router;
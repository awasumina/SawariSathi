import express from 'express';
import {
  getFare,
  getYatayatId,
  getStopsForRoutes,
  getVehicleImage  
} from '../controllers/routeControllers.js';

import {
  addStopsdb
} from '../controllers/dashboardController.js';

const router = express.Router();

// Define routes for children
router.get('/fare', getFare);
router.get('/routes/stops', getStopsForRoutes);
router.get('/yatayat/vehicleImage', getVehicleImage);
router.get('/yatayat/:id', getYatayatId);

router.post('/stops/add',addStopsdb);

export default router;
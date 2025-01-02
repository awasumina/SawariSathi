import express from 'express';
import {
  getFare,
  getYatayatId,
  getStopsForRoutes,
  getVehicleImage
} from '../controllers/routeControllers.js';

const router = express.Router();

// Define routes for children
router.get('/fare', getFare);
router.get('/routes/stops', getStopsForRoutes);
router.get('/yatayat/vehicleImage', getVehicleImage);
router.get('/yatayat/:id', getYatayatId);


export default router;
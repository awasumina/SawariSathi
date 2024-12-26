import express from 'express';
import {
  getFare,
  getYatayatId,
  getStopsForRoutes
} from '../controllers/childController.js';

const router = express.Router();

// Define routes for children
router.get('/fare', getFare);
router.get('/yatayat/:id', getYatayatId);
router.get('/routes/stops', getStopsForRoutes);


export default router;
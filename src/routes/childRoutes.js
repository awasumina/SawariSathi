import express from 'express';
import {
  getFare,
  getYatayatId
} from '../controllers/childController.js';

const router = express.Router();

// Define routes for children
router.get('/fare', getFare);
router.get('/yatayat/:id', getYatayatId);


export default router;
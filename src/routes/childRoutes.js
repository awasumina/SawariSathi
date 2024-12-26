import express from 'express';
import {
  createChildAccount,
  getAllChildren,
  getChildById,
  updateChildAccount,
  deleteChildAccount
} from '../controllers/childController.js';

const router = express.Router();

// Define routes for children
router.post('/children', createChildAccount);
router.get('/children', getAllChildren);
router.get('/children/:id', getChildById);
router.put('/children/:id', updateChildAccount);
router.delete('/children/:id', deleteChildAccount);

export default router;
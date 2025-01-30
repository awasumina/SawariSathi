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
  getStopdb,
  deleteStopById,
  getStopId,
  updateStopId
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/fare', getFare);
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


// console.log(listEndpoints(router));

export default router;
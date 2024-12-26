import dotenv from 'dotenv';
import app from './config/server.js';
import { connectDB } from './config/connectdb.js'
// import hospitalRoutes from './routes/hospitalRoutes.js';
import childRoutes from './routes/childRoutes.js'

dotenv.config();

// Connect to the database
connectDB();

// Use routes
// app.use('/api', hospitalRoutes);
app.use('/api', childRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Child Vaccination Record System API');
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
import dotenv from 'dotenv';
import app from './config/server.js';
import { connectDB } from './config/connectdb.js'
import childRoutes from './routes/routes.js'
// import childRoutes from './routes/routes.js'

dotenv.config();

// Connect to the database
connectDB();

// Use routes
app.use('/api', childRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('Welcome to the Sawari Sathi Backend API');
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



// const isempty = (value) => {
//   return value === undefined || value === null || value === '';
// };

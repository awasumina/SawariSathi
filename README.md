# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh



--public
--src
    admindashboard(login.html login.js)
    config (connectdb.js, server.js,subabaseClient.js)
    controllers(routecontrollers.js)
    routes (routes.js)
    index.js 

package.json:   "start": "nodemon ./src/index.js",

index.js content:
import dotenv from 'dotenv';
import app from './config/server.js';
import { connectDB } from './config/connectdb.js'
import childRoutes from './routes/routes.js'

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




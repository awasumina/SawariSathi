// import express from "express";
// import cors from "cors";
// import bodyParser from "body-parser";
// import path from "path";
// import { fileURLToPath } from "url";

// const app = express();

// // Fix __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.resolve();

// // Middleware setup
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static("public"));

// // Extremely simple authentication - global variable (NOT recommended for production)
// // Use this only for development purposes
// let isLoggedIn = false;

// // Authentication middleware
// const checkAuth = (req, res, next) => {
//   if (isLoggedIn) {
//     return next();
//   }
//   return res.redirect('/login');
// };

// // Serve static files from the admindashboard directory
// app.use("/admindashboard", express.static(path.join(__dirname, "src/admindashboard")));

// // Set up EJS view engine
// app.set("view engine", "ejs");
// app.set("views", path.join(__dirname, "src", "admindashboard"));

// // Serve static files (CSS, JS, images)
// app.use("/css", express.static(path.join(__dirname, "src", "admindashboard", "css")));
// app.use("/images", express.static(path.join(__dirname, "src", "admindashboard", "images")));

// // Login route
// app.get("/login", (req, res) => {
//   if (isLoggedIn) {
//     return res.redirect('/dashboard');
//   }
//   res.render("login");
// });

// // Login POST route
// app.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   const validEmail = "admin@gmail.com";
//   const validPassword = "admin";

//   if (email === validEmail && password === validPassword) {
//     isLoggedIn = true;
//     return res.redirect('/dashboard');
//   } else {
//     return res.redirect('/login');
//   }
// });

// // Dashboard route
// app.get('/dashboard', checkAuth, (req, res) => {
//   res.render('dashboard');
// });

// // Root route
// app.get('/', (req, res) => {
//   res.redirect('/login');
// });

// // Logout route
// app.get('/logout', (req, res) => {
//   isLoggedIn = false;
//   res.redirect('/login');
// });

// // API routes - also protected
// app.use('/api/*', checkAuth);

// // Handle 404
// app.use((req, res) => {
//   res.status(404).send('Page not found');
// });

// export default app;

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path"; // Import path to handle file paths
import { fileURLToPath } from "url";

const router = express.Router();

const app = express();

// Fix __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));

// Serve static files from the admindashboard directory
const __dirname = path.resolve(); // Resolve the directory name
app.use(
  "/admindashboard",
  express.static(path.join(__dirname, "src/admindashboard"))
);

// Optionally, add a specific route to serve login.html
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "src/admindashboard/login.html"));
});

app.post("/login", (req, res) => {
  //if authenthication needed change below
  const realEmail = "admin@gmail.com";
  const realPassword = "admin";
  if (realEmail == req.body.email && realPassword == req.body.password) {
    res.redirect("/dashboard");
  } else {
    res.send("Invalid credentials");
  }
});

// app.get('/admindashboard', (req, res) => {
//     res.sendFile(path.join(__dirname, 'src/admindashboard/admindashboard.html'));
//   });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src", "admindashboard"));

app.get("/dashboard", (req, res) => {
  const routes = [
    { id: 1, name: "Route 1", number: "101" },
    { id: 2, name: "Route 2", number: "102" },
  ];
  res.render("dashboard", {
    totalRoutes: routes.length,
    totalYatayat: 5,
    totalUsers: 100,
    routes,
  });
});

// Serve static files (CSS, JS, images) from correct paths
app.use(
  "/css",
  express.static(path.join(__dirname, "src", "admindashboard", "css"))
);
app.use(
  "/images",
  express.static(path.join(__dirname, "src", "admindashboard", "images"))
);
app.use(
  "/admindashboard",
  express.static(path.join(__dirname, "src/admindashboard"))
);

export default app;

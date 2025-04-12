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

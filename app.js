const express = require("express");
const app = express();
require("dotenv").config();
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const path = require("path");

// Swagger API Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Logging middleware
app.use(morgan("tiny"));

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie & File Middleware
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/temp",
  })
);

// Set view engine
app.set("view engine", "ejs");

// Import Routes
const home = require("./routrs/home");
const user = require("./routrs/user");
const product = require("./routrs/product");
const order = require("./routrs/order"); 

// Use Routes
app.use("/api/v1", home);
app.use("/api/v1", user);
app.use("/api/v1", product);
app.use("/api/v1", order);
app.use('/api/v1/cart', require('./routrs/cart')); // ✅ Ensures the correct API path
// Serve Static Files
app.use("/static", express.static(path.join(__dirname, "views1")));

// Define Static HTML Routes
app.get("/api/v1/home", (req, res) => {
  res.sendFile(path.join(__dirname, "views1", "home.html"));
});
app.get("/api/v1/addproduct", (req, res) => {
  res.sendFile(path.join(__dirname, "views1", "addproduct.html"));
});

// Export App
module.exports = app;

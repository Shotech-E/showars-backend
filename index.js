const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const app = express();
require("dotenv").config();

const port = process.env.PORT || 5000;

// middlewares
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Image route
const uploadImage = require("./src/utils/uploadImage");

// All Routes
const userRoute = require("./src/users/userRoute"); // Import the route
const productRoutes = require("./src/products/productsRoute");
const reviewRoutes = require("./src/reviews/reviewsRoute");
const ordersRoute = require("./src/orders/ordersRoute");
const statsRoute = require("./src/stats/statsRoute");

// Use the route
app.use("/api/auth", userRoute); // Mount userRoute at /api/auth
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/orders", ordersRoute);
app.use("/api/stats", statsRoute);

main()
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(process.env.DB_URL);

  app.get("/", (req, res) => {
    res.send("Welcome to Showars Shopping Mall!");
  });
}

app.post("/uploadImage", (req, res) => {
  uploadImage(req.body.image)
    .then((url) => res.send(url))
    .catch((err) => res.status(500).send(err));
});

// Start the server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

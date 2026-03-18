require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

/* ================= ROUTES ================= */

// USERS
const userRoutes = require("./models/userRoutes");
app.use("/api/users", userRoutes);

// PRODUCTS
const productRoutes = require("./models/productRoutes");
app.use("/api/products", productRoutes);

// STOCK HISTORY
const stockHistoryRoutes = require("./models/stockHistoryRoutes");
app.use("/api/stockhistory", stockHistoryRoutes);

// ORDERS
const ordersRoutes = require("./models/orders/orderRoutes");
app.use("/api/orders", ordersRoutes);

// RETURN REQUESTS
const returnRequestRoutes = require("./models/returnRequestRoutes");
app.use("/api/returnrequests", returnRequestRoutes);

// DRIVERS
const driverRoutes = require("./models/driverRoutes");
app.use("/api/drivers", driverRoutes);

// ASSIGNMENTS
const assignmentRoutes = require("./models/assignmentRoutes");
app.use("/api/assignments", assignmentRoutes);

// SUPPLIERS
const supplierRoutes = require("./models/supplierRoutes");
app.use("/api/supplier", supplierRoutes);

/* ================= TEST ROUTE ================= */
app.get("/", (req, res) => {
  res.send("🚀 Boxly Backend Running Successfully");
});

/* ================= START SERVER AFTER DB ================= */

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");
    console.log("Connected DB:", mongoose.connection.name);

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🔥 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
};

startServer();
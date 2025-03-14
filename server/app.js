// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// import helmet from "helmet";
import cookieParser from "cookie-parser";
// import morgan from "morgan";
import bodyParser from "body-parser";
import path from "path";
import pool from "./config/database.js"; // Veritabanı bağlantısı eklendi
import authRoutes from "./routes/auth.route.js";
import ticketRoutes from "./routes/ticket.route.js";
import customerRoutes from "./routes/customer.route.js";
import deviceTypeRoutes from "./routes/deviceType.route.js";
import deviceBrandRoutes from "./routes/deviceBrand.route.js";
import deviceModelRoutes from "./routes/deviceModel.route.js";
import operationRoutes from "./routes/operation.route.js";
import settingsRoutes from "./routes/settings.route.js";
import reportRoutes from "./routes/report.route.js";
import ticketLogRoutes from "./routes/ticketLog.route.js";
import dashboardRoutes from "./routes/dashboard.route.js"; // Dashboard route'u eklendi
dotenv.config(); // .env dosyasındaki çevresel değişkenleri yükler

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors()); // CORS (Cross-Origin Resource Sharing) ayarları
// app.use(helmet());
app.use(express.json()); // JSON veri formatını kabul eder
app.use(cookieParser());
// app.use(morgan("dev"));
app.use(bodyParser.json());

// Veritabanı bağlantı testi
pool
  .getConnection()
  .then((connection) => {
    console.log("Connected to the database");
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// // Rotaları kullanma
app.use("/api/auth", authRoutes);
app.use("/api/devicetypes", deviceTypeRoutes);
app.use("/api/devicebrands", deviceBrandRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/deviceModels", deviceModelRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/ticketLogs", ticketLogRoutes);
app.use("/api/dashboard", dashboardRoutes); // Dashboard route'u kullanımı

// Statik dosya sunumu (Frontend build dosyaları)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// app.use(errorHandler);

// Sunucu başlatma
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

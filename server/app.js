import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./config/database.js";
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
import dashboardRoutes from "./routes/dashboard.route.js";
import errorHandler from "./middlewares/errorHandler.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Middleware
app.use(cors()); // CORS (Cross-Origin Resource Sharing) ayarları
app.use(express.json()); // JSON veri formatını kabul eder
app.use(cookieParser());
app.use(bodyParser.json());

// Rotaları kullanma
app.use("/api/auth", authRoutes);
app.use("/api/devicetypes", deviceTypeRoutes);
app.use("/api/devicebrands", deviceBrandRoutes);
app.use("/api/deviceModels", deviceModelRoutes);
app.use("/api/operations", operationRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ticketLogs", ticketLogRoutes);
app.use("/api/dashboard", dashboardRoutes); // Dashboard route'u kullanımı
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);

// Statik dosya sunumu (Frontend build dosyaları)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client", "dist", "index.html"));
  });
}

// Hata yakalama middleware'i (rotalardan sonra!)
app.use(errorHandler);

// 404 - Sayfa Bulunamadı hatası
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "İstenen sayfa bulunamadı",
  });
});

// Sunucu başlatma
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// İşlenmeyen hataları yakala (veya process.on('uncaughtException') kullan)
process.on("unhandledRejection", (err) => {
  console.error("İşlenmeyen Promise reddi:", err);
  // Üretim ortamında uygulamayı yeniden başlatabilirsiniz
  // Veya PM2 gibi bir araç kullanarak otomatik yeniden başlatma sağlayabilirsiniz
});

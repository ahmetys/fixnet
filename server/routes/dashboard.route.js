import express from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Dashboard istatistikleri için endpoint
router.get("/stats", auth, getDashboardStats);

export default router;

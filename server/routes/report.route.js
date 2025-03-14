import express from "express";
import * as reportController from "../controllers/report.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Customer reports
router.get("/customers", auth, reportController.getCustomerStats);

// Device reports
router.get("/devices", auth, reportController.getDeviceStats);

// Ticket reports
router.get("/tickets", auth, reportController.getTicketStats);

// Operation reports
router.get("/operations", auth, reportController.getOperationStats);

// Financial reports
router.get("/financials", auth, reportController.getFinancialStats);

export default router;

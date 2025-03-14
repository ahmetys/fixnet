import express from "express";
import * as ticketLogController from "../controllers/ticketLog.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/", auth, ticketLogController.createTicketLog);
router.get("/ticket/:ticketId", auth, ticketLogController.getTicketLogs);

export default router;

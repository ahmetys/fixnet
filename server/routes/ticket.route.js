import express from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/", auth, ticketController.createTicket);
router.get("/", auth, ticketController.getAllTickets);
router.get("/:id", auth, ticketController.getTicketById);
router.put("/:id", auth, ticketController.updateTicket);
router.delete("/:id", auth, ticketController.deleteTicket);
router.get("/customer/:customerId", auth, ticketController.getTicketsByCustomerId);
router.post("/:id/operations", auth, ticketController.addTicketOperation);
router.put("/operations/:operationId", auth, ticketController.updateTicketOperation);
router.delete("/operations/:operationId", auth, ticketController.deleteTicketOperation);
router.put("/:id/deliver", auth, ticketController.markTicketDelivered);

export default router;

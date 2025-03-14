import express from "express";
import * as customerController from "../controllers/customer.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, customerController.getAllCustomers);
router.get("/:id", auth, customerController.getCustomerById);
router.post("/", auth, customerController.createCustomer);
router.put("/:id", auth, customerController.updateCustomer);
router.delete("/:id", auth, customerController.deleteCustomer);
router.post("/search", auth, customerController.searchCustomer);

export default router;

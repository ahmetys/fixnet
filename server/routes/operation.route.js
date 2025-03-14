import express from "express";
import { getAllOperations, getOperationById, createOperation, updateOperation, deleteOperation } from "../controllers/operation.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getAllOperations);
router.get("/:id", auth, getOperationById);
router.post("/", auth, createOperation);
router.put("/:id", auth, updateOperation);
router.delete("/:id", auth, deleteOperation);

export default router;

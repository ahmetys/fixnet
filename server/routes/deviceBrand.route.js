import express from "express";
import { getAllDeviceBrands, getDeviceBrandById, createDeviceBrand, updateDeviceBrand, deleteDeviceBrand } from "../controllers/deviceBrand.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getAllDeviceBrands);
router.get("/:id", auth, getDeviceBrandById);
router.post("/", auth, createDeviceBrand);
router.put("/:id", auth, updateDeviceBrand);
router.delete("/:id", auth, deleteDeviceBrand);

export default router;

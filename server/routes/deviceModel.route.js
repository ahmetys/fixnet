import express from "express";
import { getAllDeviceModels, getDeviceModelById, createDeviceModel, updateDeviceModel, deleteDeviceModel, getAllDeviceModelsByType } from "../controllers/deviceModel.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.get("/", auth, getAllDeviceModels);
router.get("/:id", auth, getDeviceModelById);
router.post("/", auth, createDeviceModel);
router.put("/:id", auth, updateDeviceModel);
router.delete("/:id", auth, deleteDeviceModel);
router.get("/type/:typeId", auth, getAllDeviceModelsByType);

export default router;

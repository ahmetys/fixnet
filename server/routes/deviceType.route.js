import express from "express";
import * as deviceTypeController from "../controllers/deviceType.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, deviceTypeController.getAllDeviceTypes);
router.get("/:id", auth, deviceTypeController.getDeviceTypeById);
router.post("/", auth, deviceTypeController.createDeviceType);
router.put("/:id", auth, deviceTypeController.updateDeviceType);
router.delete("/:id", auth, deviceTypeController.deleteDeviceType);
router.get("/brand/:brandId", auth, deviceTypeController.getAllDeviceTypesByBrand);

export default router;

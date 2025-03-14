import express from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", auth, settingsController.getSettings);
router.put("/", auth, settingsController.updateSettings);

export default router;

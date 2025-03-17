import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", auth, authController.logout);
router.get("/me", auth, authController.getCurrentUser);
router.post("/forgot-password", authController.forgotPassword);
router.get("/reset-token/:token", authController.verifyResetToken);
router.post("/reset-password", authController.resetPassword);
export default router;

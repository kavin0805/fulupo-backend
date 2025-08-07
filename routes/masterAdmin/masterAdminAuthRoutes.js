// routes/authRoutes.js
import express from "express";
import { masterAdminLogin, verifyMasterAdminOtp } from "../../controllers/masterAdmin/authController.js";

const router = express.Router();

router.post("/login", masterAdminLogin);
router.post("/verify-otp", verifyMasterAdminOtp);

export default router;

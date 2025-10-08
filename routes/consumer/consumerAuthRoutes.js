import express from "express";
import { sendOtp, verifyConsumerOtp } from "../../controllers/consumer/consumerAuth.js";


const router = express.Router();

// Send OTP / Login
router.post("/login", sendOtp); 

// Verify OTP
router.post("/verify-otp", verifyConsumerOtp);

export default router;

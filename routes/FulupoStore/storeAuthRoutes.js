import { storeLogin, verifyStoreOtp } from "../../controllers/FulupoStore/authController.js";
import express from 'express';

const router = express.Router();

router.post('/store-login', storeLogin);
router.post('/verify-store-otp', verifyStoreOtp);

export default router;
import express from 'express';
import { loginUser, registerUser } from '../../controllers/onBoarding/authController.js';
const router = express.Router();

router.post('/onBoarding/register', registerUser);
router.post('/onBoarding/login', loginUser);

export default router;
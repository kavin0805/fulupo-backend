import express from 'express';
import { getAllProductProfitLoss, getSingleProductProfitLoss } from '../../controllers/FulupoStore/profitLossController.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';

const router = express.Router();

router.post('/all', authMasterStoreAdmin , checkStoreVerified , getAllProductProfitLoss);         // 📊 All products
router.post('/single', authMasterStoreAdmin , checkStoreVerified ,  getSingleProductProfitLoss);   // 📦 Single product

export default router;

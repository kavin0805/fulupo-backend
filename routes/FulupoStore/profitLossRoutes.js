import express from 'express';
import { getAllProductProfitLoss, getSingleProductProfitLoss } from '../../controllers/FulupoStore/profitLossController.js';

const router = express.Router();

router.post('/all', getAllProductProfitLoss);         // 📊 All products
router.post('/single', getSingleProductProfitLoss);   // 📦 Single product

export default router;

import express from 'express';

import { upload } from '../../middleware/upload.js';
import { addPurchase, getAllPurchases, getPurchaseById, getPurchasesByDateRange, getPurchasesByPeriod, updatePurchase } from '../../controllers/FulupoStore/purchaseController.js';
import auth from '../../middleware/auth.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';

const router = express.Router();

// Routes
router.post('/add', verifyStoreAdmin ,  upload.array('bill_image'), addPurchase);
router.put('/update/:id', verifyStoreAdmin , upload.array('bill_image'), updatePurchase);
router.post('/get',  verifyStoreAdmin ,  getAllPurchases);
router.post('/getById/:id', verifyStoreAdmin , getPurchaseById);
router.post('/get/filter/:type', verifyStoreAdmin , getPurchasesByPeriod); // day/week/month/year
router.post('/get/date-range', verifyStoreAdmin , getPurchasesByDateRange);

export default router;

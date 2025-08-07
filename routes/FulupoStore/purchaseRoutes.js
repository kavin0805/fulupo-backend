import express from 'express';

import { upload } from '../../middleware/upload.js';
import { addPurchase, getAllPurchases, getPurchaseById, getPurchasesByDateRange, getPurchasesByPeriod, updatePurchase } from '../../controllers/FulupoStore/purchaseController.js';
// import auth from '../../middleware/auth.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';

const router = express.Router();

// Routes
router.post('/add', authMasterStoreAdmin , checkStoreVerified ,  upload.array('bill_image' ), addPurchase);
router.put('/update/:id', authMasterStoreAdmin , checkStoreVerified , upload.array('bill_image'), updatePurchase);
router.post('/get',  authMasterStoreAdmin , checkStoreVerified , getAllPurchases);
router.post('/getById/:id', authMasterStoreAdmin , checkStoreVerified , getPurchaseById);
router.post('/get/filter/:type', authMasterStoreAdmin , checkStoreVerified ,  getPurchasesByPeriod); // day/week/month/year
router.post('/get/date-range', authMasterStoreAdmin , checkStoreVerified , getPurchasesByDateRange);
// /api/purchase/by-vendor

// {
//   "storeId": "your_store_id_here",
//   "vendorName": "Vendor One"
// }

export default router;

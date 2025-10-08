import express from 'express';
import { addWastage, getWastage, getWastageByDateRange, getWastageByPeriod, getWastageByProduct, updateWastage } from '../../controllers/FulupoStore/wastageController.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';


const router = express.Router();

// 📌 Add new wastage
router.post('/add', authMasterStoreAdmin , checkStoreVerified , addWastage);

// 📌 Update wastage by ID
router.put('/update/:id', authMasterStoreAdmin , checkStoreVerified , updateWastage);

// 📌 Get wastage by storeId and store_category_id
router.post('/get', authMasterStoreAdmin , checkStoreVerified , getWastage);

// 📌 Get wastage by day/week/month/year
router.post('/get-by-period/:type', authMasterStoreAdmin , checkStoreVerified , getWastageByPeriod);  // type: day | week | month | year

// 📌 Get wastage by product_id
router.post('/get-by-product', authMasterStoreAdmin , checkStoreVerified , getWastageByProduct);

// 📌 Get wastage by date range
router.post('/get-by-daterange', authMasterStoreAdmin , checkStoreVerified , getWastageByDateRange);

export default router;

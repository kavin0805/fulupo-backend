import express from 'express';
import { addWastage, getWastage, getWastageByDateRange, getWastageByPeriod, getWastageByProduct, updateWastage } from '../../controllers/FulupoStore/wastageController.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';


const router = express.Router();

// 📌 Add new wastage
router.post('/add', verifyStoreAdmin , addWastage);

// 📌 Update wastage by ID
router.put('/update/:id', verifyStoreAdmin , updateWastage);

// 📌 Get wastage by storeId and store_category_id
router.post('/get', verifyStoreAdmin , getWastage);

// 📌 Get wastage by day/week/month/year
router.post('/get-by-period/:type', verifyStoreAdmin , getWastageByPeriod);  // type: day | week | month | year

// 📌 Get wastage by product_id
router.post('/get-by-product', verifyStoreAdmin , getWastageByProduct);

// 📌 Get wastage by date range
router.post('/get-by-daterange', verifyStoreAdmin , getWastageByDateRange);

export default router;

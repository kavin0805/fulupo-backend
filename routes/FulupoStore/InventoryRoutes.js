import express from 'express';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { getInventoryByProduct, getInventoryByStore, getInventoryByStoreCategory } from '../../controllers/FulupoStore/inventoryController.js';

const router = express.Router();

// Routes
router.post('/get/by-store', verifyStoreAdmin , getInventoryByStore);
router.post('/get/by-store-category', verifyStoreAdmin , getInventoryByStoreCategory);
router.post('/get/by-product', verifyStoreAdmin , getInventoryByProduct);

export default router;
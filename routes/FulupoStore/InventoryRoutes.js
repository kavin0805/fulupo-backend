import express from 'express';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { getInventoryByProduct, getInventoryByStore, getInventoryByStoreCategory } from '../../controllers/FulupoStore/inventoryController.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';

const router = express.Router();

// Routes
router.post('/get/by-store', authMasterStoreAdmin , checkStoreVerified , getInventoryByStore);
router.post('/get/by-store-category', authMasterStoreAdmin , checkStoreVerified , getInventoryByStoreCategory);
router.post('/get/by-product', authMasterStoreAdmin , checkStoreVerified , getInventoryByProduct);

export default router;
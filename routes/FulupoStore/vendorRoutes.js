import express from 'express';
import { addVendor, getPurchasesByVendorName, getVendorList, getVendorsByProductId } from '../../controllers/FulupoStore/vendorController.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';


const router = express.Router();

router.post('/add', verifyStoreAdmin ,  addVendor);
router.post('/list', verifyStoreAdmin , getVendorList);
router.post('/by-id', verifyStoreAdmin , getPurchasesByVendorName);
router.post('/by-product', verifyStoreAdmin , getVendorsByProductId);

export default router;

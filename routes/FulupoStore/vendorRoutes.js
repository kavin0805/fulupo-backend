import express from 'express';
import { addVendor, getPurchasesByVendorName, getVendorList, getVendorsByProductId } from '../../controllers/FulupoStore/vendorController.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';


const router = express.Router();

router.post('/add', authMasterStoreAdmin , checkStoreVerified ,  addVendor);
router.post('/list', authMasterStoreAdmin , checkStoreVerified , getVendorList);
router.post('/by-id', authMasterStoreAdmin , checkStoreVerified , getPurchasesByVendorName);
router.post('/by-product', authMasterStoreAdmin , checkStoreVerified , getVendorsByProductId);

export default router;

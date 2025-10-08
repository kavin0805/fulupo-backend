import express from 'express';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { addSale, getSalesByCustomerMobile, getSalesByDateRange, getSalesByPeriod, getSalesByStore } from '../../controllers/FulupoStore/salesController.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';


const router = express.Router();

router.post('/add', authMasterStoreAdmin , checkStoreVerified , addSale);
router.post('/get-by-store', authMasterStoreAdmin , checkStoreVerified , getSalesByStore);
router.post('/get-by-period/:type', authMasterStoreAdmin , checkStoreVerified , getSalesByPeriod); // type: day/week/month/year
router.post('/get-by-customer', authMasterStoreAdmin , checkStoreVerified ,  getSalesByCustomerMobile);
router.post('/get-by-daterange', authMasterStoreAdmin , checkStoreVerified , getSalesByDateRange);

export default router;

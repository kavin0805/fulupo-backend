import express from 'express';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { addSale, getSalesByCustomerMobile, getSalesByDateRange, getSalesByPeriod, getSalesByStore } from '../../controllers/FulupoStore/salesController.js';


const router = express.Router();

router.post('/add', verifyStoreAdmin , addSale);
router.post('/get-by-store', verifyStoreAdmin , getSalesByStore);
router.post('/get-by-period/:type', verifyStoreAdmin , getSalesByPeriod); // type: day/week/month/year
router.post('/get-by-customer', verifyStoreAdmin ,  getSalesByCustomerMobile);
router.post('/get-by-daterange', verifyStoreAdmin , getSalesByDateRange);

export default router;

import express from 'express';
import { 
    getOverallSummary,
       getProfitLossSummary, 
    getPurchaseSummary, 
    getSalesSummary, 
    getStoreOverviewSummary, 
    getWastageSummary } from '../../controllers/FulupoStore/summaryController.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';


const router = express.Router();

router.post('/overall', authMasterStoreAdmin , checkStoreVerified , getOverallSummary);
router.post('/overview', authMasterStoreAdmin , checkStoreVerified , getStoreOverviewSummary);
router.post('/sales', authMasterStoreAdmin , checkStoreVerified , getSalesSummary);
router.post('/purchases', authMasterStoreAdmin , checkStoreVerified , getPurchaseSummary);
router.post('/wastage', authMasterStoreAdmin , checkStoreVerified , getWastageSummary);
// router.post('/profit-loss', getProfitLossSummary);

export default router;

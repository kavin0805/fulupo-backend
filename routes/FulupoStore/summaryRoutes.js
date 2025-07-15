import express from 'express';
import { 
    getOverallSummary,
       getProfitLossSummary, 
    getPurchaseSummary, 
    getSalesSummary, 
    getStoreOverviewSummary, 
    getWastageSummary } from '../../controllers/FulupoStore/summaryController.js';


const router = express.Router();

router.post('/overall', getOverallSummary);
router.post('/overview', getStoreOverviewSummary);
router.post('/sales', getSalesSummary);
router.post('/purchases', getPurchaseSummary);
router.post('/wastage', getWastageSummary);
// router.post('/profit-loss', getProfitLossSummary);

export default router;

import express from "express";
import { addPurchaseReturn, getAllPurchaseReturns, getPurchaseReturnsByPeriod } from "../../controllers/FulupoStore/purchaseReturnsController.js";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js";

const router = express.Router();

router.post("/add", verifyStoreAdmin , addPurchaseReturn);
router.post("/purchase-return/getAllPurchaseReturns", verifyStoreAdmin , getAllPurchaseReturns);
router.post("/purchase-return/getPurchaseReturnsByPeriod", verifyStoreAdmin , getPurchaseReturnsByPeriod); 

export default router;

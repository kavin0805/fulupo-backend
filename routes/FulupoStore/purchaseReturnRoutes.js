import express from "express";
import { addPurchaseReturn, getAllPurchaseReturns, getPurchaseReturnsByPeriod, getVendorsByProductAndStore } from "../../controllers/FulupoStore/purchaseReturnsController.js";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js";
import { checkStoreVerified } from "../../middleware/checkStoreVerification.js";
import { authMasterStoreAdmin } from "../../middleware/authMasterAdmin.js";

const router = express.Router();

router.post("/add", authMasterStoreAdmin , checkStoreVerified , addPurchaseReturn);
router.post("/getAllPurchaseReturns", authMasterStoreAdmin , checkStoreVerified , getAllPurchaseReturns);
router.post("/getPurchaseReturnsByPeriod", authMasterStoreAdmin , checkStoreVerified, getPurchaseReturnsByPeriod); 
router.post("/vendor/by-product", authMasterStoreAdmin ,  checkStoreVerified , getVendorsByProductAndStore);

export default router;
          
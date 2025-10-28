import express from "express";
import upload from '../../middleware/upload.js'
import { consumerAuth } from "../../middleware/consumerAuth.js";
import { authMasterStoreAdmin } from "../../middleware/authMasterAdmin.js";
import { approveReturn, completeRefund, createReturnRequest, getAllReturns, getReturnById, rejectReturn } from "../../controllers/consumer/ReturnController.js";

const router = express.Router();

router.post("/create", consumerAuth, upload.array("images"), createReturnRequest);
router.put("/approve/:returnId", authMasterStoreAdmin ,  approveReturn);
router.put("/reject/:returnId", authMasterStoreAdmin , rejectReturn);
router.put("/refund/:returnId", authMasterStoreAdmin , completeRefund);
router.get("/all", consumerAuth, authMasterStoreAdmin ,  getAllReturns);
router.get("/:returnId", consumerAuth, getReturnById);

export default router;

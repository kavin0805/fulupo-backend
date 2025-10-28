import express from "express";
import { consumerAuth } from "../../middleware/consumerAuth.js";
import {
  deleteReplacement,
  getAllReplacements,
  getReplacementsByCustomer,
  requestReplacement,
  updateReplacementStatus,
} from "../../controllers/consumer/replacementController.js";
import { upload } from "../../middleware/upload.js";

const router = express.Router();

router.post("/request", consumerAuth, upload.array("images", 5) , requestReplacement);
router.get("/all", getAllReplacements);
router.get("/customer/:customerId", consumerAuth, getReplacementsByCustomer);
router.put("/status/:replacementId", updateReplacementStatus);
router.delete("/:id", deleteReplacement);

export default router;

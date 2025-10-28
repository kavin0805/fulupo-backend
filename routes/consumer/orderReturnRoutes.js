import express from "express";
import multer from "multer";
import {
  createReturn,
  getMyReturns,
  getReturnById,
  updateReturnStatus,
} from "../../controllers/consumer/OrderReturnController.js";
import { consumerAuth } from "../../middlewares/consumerAuth.js";

const router = express.Router();

// ⚙️ Multer config for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/returns"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_")),
});
const upload = multer({ storage });

// 🧾 Create return with images
router.post("/", consumerAuth, upload.array("images", 5), createReturn);

// 📦 Get my returns
router.get("/", consumerAuth, getMyReturns);

// 🔍 Get single return
router.get("/:returnId", consumerAuth, getReturnById);

// ✅ Approve or Reject (for admin/store)
router.put("/:returnId/status", updateReturnStatus);

export default router;

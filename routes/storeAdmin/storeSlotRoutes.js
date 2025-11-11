import express from "express";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js";
import {
  publishSlotsForDate,
  createSlot,
  bulkCreateSlots,
  listSlots,
  updateSlot,
  deleteSlot,
} from "../../controllers/storeAdmin/storeSlotController.js";

const router = express.Router();

// Publish by template (auto-generate ranges based on active template)
router.post("/publish", verifyStoreAdmin, publishSlotsForDate);

// CRUD for store-specific slots
router.post("/", verifyStoreAdmin, createSlot);
router.post("/bulk-slots", verifyStoreAdmin, bulkCreateSlots);
router.get("/slots", verifyStoreAdmin, listSlots);
router.put("/:slotId", verifyStoreAdmin, updateSlot);
router.delete("/:slotId", verifyStoreAdmin, deleteSlot);

export default router;
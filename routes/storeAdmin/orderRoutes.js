import express from "express";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js";
import { approveOrder, assignDeliveryPerson, reassignDeliveryPerson, getStoreOrders} from "../../controllers/storeAdmin/orderController.js";

const router = express.Router();

router.post("/approve", verifyStoreAdmin, approveOrder);
router.post("/assign-dp", verifyStoreAdmin, assignDeliveryPerson);
router.post("/reassign-dp", verifyStoreAdmin, reassignDeliveryPerson);
router.get("/list", verifyStoreAdmin, getStoreOrders);

export default router;
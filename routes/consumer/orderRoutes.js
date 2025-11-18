import express from "express";
import { consumerAuth } from "../../middleware/consumerAuth.js";
import { PlaceOrderWithSlot, getMyOrders, getOrderById, updatePaymentStatus, verifyPayment, rateDelivery, listAvailableSlots } from "../../controllers/consumer/OrderController.js";

const router = express.Router();

router.post("/place-order", consumerAuth, PlaceOrderWithSlot);
router.post("/verify-payment", consumerAuth, verifyPayment);
router.get("/my-orders", consumerAuth, getMyOrders);
router.get("/slots", consumerAuth, listAvailableSlots);
router.get("/:orderId", consumerAuth, getOrderById);
router.post("/updatePayment", consumerAuth, updatePaymentStatus);
router.post("/rate", consumerAuth, rateDelivery);


export default router;

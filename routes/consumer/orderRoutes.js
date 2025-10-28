import express from "express";
import { consumerAuth } from "../../middleware/consumerAuth.js";
import { createOrder, getMyOrders, getOrderById, updatePaymentStatus, verifyPayment } from "../../controllers/consumer/OrderController.js";

const router = express.Router();

router.post("/create", consumerAuth, createOrder);
router.post("/verify-payment", consumerAuth, verifyPayment);
router.get("/my-orders", consumerAuth, getMyOrders);
router.get("/:orderId", consumerAuth, getOrderById);
router.post("/updatePayment", consumerAuth, updatePaymentStatus);

export default router;

import ReturnRequest from "../../modules/consumer/ReturnRequest.js";
import Order from "../../modules/consumer/Order.js";
import { razorpayInstance } from "../../utils/razorpay.js";
import crypto from "crypto";

// 📦 Create return request
export const createReturnRequest = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { orderId, productId, storeId, quantity, reason } = req.body;
    const images = req.files?.map((f) => f.path); // assuming multer for upload

    if (!orderId || !productId || !quantity || !reason)
      return res.status(400).json({ message: "Missing required fields" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const returnReq = await ReturnRequest.create({
      orderId,
      consumerId,
      productId,
      storeId,
      quantity,
      reason,
      images,
      refundAmount: 0,
    });

    res.json({ message: "Return request created", returnReq });
  } catch (err) {
    res.status(500).json({ message: "Error creating return request", error: err.message });
  }
};

// ✅ Approve return request
export const approveReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnReq = await ReturnRequest.findById(returnId).populate("orderId");

    if (!returnReq) return res.status(404).json({ message: "Return not found" });
    if (returnReq.status !== "Pending")
      return res.status(400).json({ message: "Already processed" });

    // Calculate refund
    const refundAmount = calculateRefund(returnReq.orderId, returnReq.productId, returnReq.quantity);
    returnReq.status = "Approved";
    returnReq.refundAmount = refundAmount;
    returnReq.refundStatus = "Initiated";
    await returnReq.save();

    // Refund process based on payment mode
    const order = returnReq.orderId;
    if (order.paymentMode === "Razorpay" && order.paymentStatus === "Paid") {
      const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
        amount: Math.round(refundAmount * 100),
      });
      returnReq.refundTransactionId = refund.id;
      returnReq.refundStatus = "Completed";
    } else if (order.paymentMode === "COD") {
      // COD refund handled manually or wallet credit
      returnReq.refundStatus = "Pending for manual refund";
    }

    await returnReq.save();

    res.json({ message: "Return approved & refund processed", returnReq });
  } catch (err) {
    res.status(500).json({ message: "Error approving return", error: err.message });
  }
};

// ❌ Reject return request
export const rejectReturn = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnReq = await ReturnRequest.findById(returnId);

    if (!returnReq) return res.status(404).json({ message: "Return not found" });

    returnReq.status = "Rejected";
    await returnReq.save();

    res.json({ message: "Return request rejected", returnReq });
  } catch (err) {
    res.status(500).json({ message: "Error rejecting return", error: err.message });
  }
};

// 💰 Manual refund (for COD orders)
export const completeRefund = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { transactionId } = req.body;

    const returnReq = await ReturnRequest.findById(returnId);
    if (!returnReq) return res.status(404).json({ message: "Return not found" });

    returnReq.refundStatus = "Completed";
    returnReq.refundTransactionId = transactionId;
    returnReq.status = "Refunded";
    await returnReq.save();

    res.json({ message: "Refund completed successfully", returnReq });
  } catch (err) {
    res.status(500).json({ message: "Error completing refund", error: err.message });
  }
};

// 📋 Get all returns (Admin or consumer)
export const getAllReturns = async (req, res) => {
  try {
    const consumerId = req.consumer?._id;
    const query = consumerId ? { consumerId } : {};

    const returns = await ReturnRequest.find(query)
      .populate("orderId")
      .populate("productId", "name")
      .sort({ createdAt: -1 });

    res.json({ count: returns.length, returns });
  } catch (err) {
    res.status(500).json({ message: "Error fetching returns", error: err.message });
  }
};

// 🔍 Get return by ID
export const getReturnById = async (req, res) => {
  try {
    const { returnId } = req.params;
    const returnReq = await ReturnRequest.findById(returnId)
      .populate("orderId")
      .populate("productId", "name");

    if (!returnReq) return res.status(404).json({ message: "Return not found" });

    res.json({ returnReq });
  } catch (err) {
    res.status(500).json({ message: "Error fetching return details", error: err.message });
  }
};

// 🔧 Helper to calculate refund
const calculateRefund = (order, productId, quantity) => {
  const item = order.items.find((i) => i.productId.toString() === productId.toString());
  if (!item) return 0;
  return (item.price / item.quantity) * quantity;
};

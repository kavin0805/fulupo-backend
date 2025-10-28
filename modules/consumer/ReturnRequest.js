import mongoose from "mongoose";

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  consumerId: { type: mongoose.Schema.Types.ObjectId, ref: "Consumer", required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "MasterProduct", required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
  quantity: { type: Number, required: true },
  reason: { type: String, required: true },
  images: [{ type: String }], // image URLs
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Refunded"],
    default: "Pending",
  },
  refundStatus: {
    type: String,
    enum: ["Not Initiated", "Initiated", "Completed", "Failed"],
    default: "Not Initiated",
  },
  refundAmount: { type: Number, default: 0 },
  refundTransactionId: { type: String },
}, { timestamps: true });

export default mongoose.model("ReturnRequest", returnRequestSchema);

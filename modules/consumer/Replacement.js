import mongoose from "mongoose";

const replacementSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Store",
    required: true,
  },
  reason: { type: String, required: true },
  images: [{ type: String }], 
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Replaced"],
    default: "Pending",
  },
  adminComment: { type: String },
  replacementOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  quantity: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

replacementSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("Replacement", replacementSchema);

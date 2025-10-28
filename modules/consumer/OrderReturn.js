import mongoose from "mongoose";

const orderReturnSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  consumerId: { type: mongoose.Schema.Types.ObjectId, ref: "Consumer", required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },

  reason: { type: String, required: true },
  images: [{ type: String }], // multiple proof images

  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Completed"],
    default: "Pending",
  },
  products: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
      product_name: String,
      quantity: Number,
      price: Number,
    },
  ],
  refundAmount: { type: Number, default: 0 },
  remarks: { type: String }, // admin remarks for approve/reject
}, { timestamps: true });

export default mongoose.model("OrderReturn", orderReturnSchema);

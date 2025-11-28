import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    consumerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consumer",
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ConsumerAddress",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: String,
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    paymentMode: { type: String, enum: ["COD", "Razorpay"], required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    orderNumber: { type: String, unique: true, index: true },
    fastDelivery: { type: Boolean, default: false },
    deliveryCharge: { type: Number, default: 25 },
    orderStatus: {
      type: String,
      enum: [
        "PENDING_STORE_APPROVAL",
        "WAITING_FOR_DP_ASSIGNMENT",
        "ASSIGNED_TO_DP",
        "ACCEPTED_BY_DP",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "REJECTED_BY_DP",
      ],
      default: "PENDING_STORE_APPROVAL",
    },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: "StoreDeliverySlot" },
    slotDate: String,
    slotStart: String,
    slotEnd: String,
    deliveryPin: String,
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
    },
    deliveryRating: { type: Number, min: 1, max: 5 },
    deliveredAt: Date,
    rejectionReason: { type: String, default: null },
    rejectedAt: { type: Date },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");

    const randomDigits = Math.floor(
      100000000000 + Math.random() * 900000000000
    );
    this.orderNumber = `ORD${year}${month}${randomDigits}`;
  }
  next();
});

export default mongoose.model("Order", orderSchema);

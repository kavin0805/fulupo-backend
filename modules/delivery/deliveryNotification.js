import mongoose from "mongoose";

const deliveryNotificationSchema = new mongoose.Schema(
  {
    deliveryPersonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryPerson",
      index: true,
      required: true,
    },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    // notification type
    type: {
      type: String,
      enum: [
        "StatusDelivered",
        "StatusRejected",
        "StatusCancelled",
        "PaymentCredited",
        "PaymentFailed",
        "Info",
      ],
      required: true,
    },

    // title of the message
    title: { type: String, required: true }, 
    message: { type: String, required: true }, 
    isRead: { type: Boolean, default: false, index: true },
    readAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

// Index for cleaning up expired notifications
deliveryNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model(
  "DeliveryNotification",
  deliveryNotificationSchema
);

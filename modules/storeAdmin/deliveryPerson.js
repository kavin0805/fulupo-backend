import mongoose from "mongoose";

const deliveryPersonSchema = new mongoose.Schema(
  {
    // Assigned store ID
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    profileImage: String,
    otp: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false },

    // Vehicle details
    vehicleNumber: String,
    vehiclePhoto: String,
    rcNumber: String,
    rcImage: String,
    insuranceNumber: String,
    insuranceImage: String,

    // Documents
    aadharNumber: String,
    aadharImage: String,
    drivingLicenseNumber: String,
    drivingLicenseImage: String,
    otherDocuments: [{ name: String, image: String }],

    // Bank details
    bankName: String,
    accountNumber: String,
    ifscCode: String,
    branch: String,
    passbookImage: String,

    // Status
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },
    isAvailable: { type: Boolean, default: true },

    // Metrics for performance tracking
    totalDeliveries: { type: Number, default: 0 },
    completedDeliveries: { type: Number, default: 0 },
    pendingDeliveries: { type: Number, default: 0 },
    rejectedDeliveries: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },

    // rejection related fields
    rejectionLimitPerDay: { type: Number, default: 5 },
    rejectionCount: { type: Number, default: 0 },
    rejectionCountDate: { type: String }, // "YYYY-MM-DD"

    // Earnings & payout
    earningsPerDelivery: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    payoutAmount: { type: Number, default: 0 },
    nextPayoutDate: Date,
  },
  { timestamps: true }
);

// Index for faster query retrievals
deliveryPersonSchema.index({ storeId: 1, status: 1, isAvailable: 1 });

export default mongoose.model("DeliveryPerson", deliveryPersonSchema);

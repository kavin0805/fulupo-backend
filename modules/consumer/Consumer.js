import mongoose from "mongoose";

const consumerSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, sparse: true },
  mobile: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store"},
  otp: { type: String },        // temporary OTP
  otpExpiry: { type: Date },    // OTP validity
}, { timestamps: true });

export default mongoose.model("Consumer", consumerSchema);

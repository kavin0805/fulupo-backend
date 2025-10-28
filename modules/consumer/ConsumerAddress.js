import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  consumerId: { type: mongoose.Schema.Types.ObjectId, ref: "Consumer", required: true },
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  addressLine: { type: String, required: true },
  addressName : { type: String, required: true },
  addressType: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model("ConsumerAddress", addressSchema);

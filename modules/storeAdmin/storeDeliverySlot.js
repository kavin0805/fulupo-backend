import mongoose from "mongoose";

const storeDeliverySlotSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  date: { type: String, required: true, index: true },
  start: { type: String, required: true },
  end: { type: String, required: true },  
  capacity: { type: Number, required: true }, 
  bookedCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

storeDeliverySlotSchema.index({ storeId: 1, date: 1, start: 1 }, { unique: true });

export default mongoose.model("StoreDeliverySlot", storeDeliverySlotSchema);

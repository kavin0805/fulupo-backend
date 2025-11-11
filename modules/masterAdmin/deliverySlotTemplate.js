import mongoose from "mongoose";

// to create a template for slot creation
const deliverySlotTemplateSchema = new mongoose.Schema({
  name: { type: String, default: "Default" }, 
  startTime: { type: String, required: true }, 
  endTime: { type: String, required: true },   
  durationMins: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model("DeliverySlotTemplate", deliverySlotTemplateSchema);

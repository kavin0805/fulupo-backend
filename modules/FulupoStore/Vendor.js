import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  vendorName: { type: String, required: true },
  vendorGst: { type: String, required: true },
  vendorMobile: { type: String, required: true },
  vendorLandline: String,
  vendorAddress: String
});

export default mongoose.model('Vendor', vendorSchema);

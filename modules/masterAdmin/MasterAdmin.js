import mongoose from 'mongoose';

const masterAdminSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, required: true, unique: true },
  otp: String,
  otpExpiry: Date
}, { timestamps: true });

export default mongoose.model('MasterAdmin', masterAdminSchema);
import mongoose from 'mongoose';

const storeCategoryCustomSchema = new mongoose.Schema({
  icon: {
    type: String, // stores image filename or full URL
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('StoreCategoryCustom', storeCategoryCustomSchema);

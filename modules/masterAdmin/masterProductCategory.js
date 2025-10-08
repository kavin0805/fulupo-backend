// models/MasterProductCategory.js
import mongoose from 'mongoose';

const MasterProductCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String
}, { timestamps: true });

export default mongoose.model('MasterProductCategory', MasterProductCategorySchema);

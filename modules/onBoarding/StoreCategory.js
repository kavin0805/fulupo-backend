import mongoose from 'mongoose';

const storeCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model('StoreCategory', storeCategorySchema);  
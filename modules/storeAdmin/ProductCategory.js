import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  name: { type: String, required: true },
  description: String,
  icon: { type: String, required: true }  // 📌 added icon field (image filename or path)
});

export default mongoose.model('ProductCategory', productCategorySchema);

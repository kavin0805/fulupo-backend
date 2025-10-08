import mongoose from 'mongoose';

const subProductSchema = new mongoose.Schema({
  storeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Store',
  required: true
},
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  unit: { type: String, required: true }, // Example: "100g", "1kg", etc.
  mrpPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  stockAvailableQty: { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('SubProduct', subProductSchema);

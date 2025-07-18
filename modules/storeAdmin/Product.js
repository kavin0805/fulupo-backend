import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
productCode: {
  type: String,
  required: true
},
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId }, // , ref: 'ProductCategory', required: true
  productImage: { type: String }, // store image filename or URL
  mrpPrice: { type: Number },
  discountPrice: { type: Number},
  netQty:{ type : String },
  purchasePrice: { type: Number },
  showAvlQty: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);

import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  storeId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Store',
  required: true
},
productCode: {
  type: String,
  required: true
},
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  productImage: { type: String , required: true}, // store image filename or URL
  mrpPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  netQty:{ type : String , required : true},
  purchasePrice: { type: Number },
  showAvlQty: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);

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
  // categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory', required: true },
  dimenstionImages: { type: [String] }, // store image filename or URL
  masterProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProducts', required: true },
  purchasePrice:{ type: String } ,
  mrpPrice: { type: Number , required : true },
  discountPrice: { type: Number},
  netQty:{ type : String },
  purchasePrice: { type: Number },
  showAvlQty: { type: Number, default: 0 },
  height:{type : String},
  width:{type : String},
  length:{type : String}
}, { timestamps: true });

export default mongoose.model('Product', productSchema);

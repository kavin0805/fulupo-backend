import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  product_rate: { type: Number, required: true },
  mrpPrice: { type: Number, required: true },
  // product_qty_kg: { type: Number},
  product_qty: { type: Number , required : true},
  product_gst_percent: { type: Number, required: true },
  product_amount: { type: Number, required: true },
  return_qty: { type: Number, default: 0 },  
  return_amount: { type: Number, default: 0 }
});

const purchaseSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  // store_category_id: {
  //   type: mongoose.Schema.Types.ObjectId,     
  //   ref: 'StoreCategoryCustom',
  //   required: true
  // },
  vendorName: { type: String, required: true },
  vendorGst: { type: String },
  vendorMobile: { type: String },
  vendorLandline: { type: String },
  vendorAddress: { type: String },
  purchaseDate: { type: Date, required: true },
  purchaseBillNo: { type: String },
  overallTotal: { type: Number, required: true },
  product: [productSchema],
  bill_image: { type: [String] },    
}, { timestamps: true });

export default mongoose.model('Purchase', purchaseSchema);

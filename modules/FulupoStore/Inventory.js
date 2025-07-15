import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  // storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  // // store_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'StoreCategoryCustom', required: true },
  // product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  // product_name: { type: String, required: true },
  // // unit: { type: String, required: true }, // example: 100g, 1kg, 1 pack
  // quantity: { type: Number, required: true },
  // product_rate:{ type: Number, required: true },
  // product_gst_percent:{ type: Number, required: true },
  // product_amount:{ type: Number, required: true }

  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  product_img: String,
  product_name: String,
  totalQty: Number,
  quantity: Number,
  product_rate: Number,
  product_gst_percent: Number,
  product_amount: Number,
  percentage: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);


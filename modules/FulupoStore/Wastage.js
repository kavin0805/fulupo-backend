import mongoose from "mongoose";

const wastageSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  date: { type: Date, required: true },
  remark: { type: String },
  productList: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      product_name: String,
      quantity: Number,
      reason: String,
    }
  ]
}, { timestamps: true });
   
export default mongoose.model('Wastage', wastageSchema);
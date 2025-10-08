import mongoose from 'mongoose';

const purchaseReturnSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  vendorName: String,
  returnDate: { type: Date, default: Date.now },
  reason: String,
  product: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      product_name: String,
      return_qty: Number,
      product_rate: Number,
      product_amount: Number,
    },
  ],
  purchaseRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
});

export default mongoose.model('PurchaseReturn', purchaseReturnSchema);

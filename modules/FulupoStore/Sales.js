import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  product_name: String,
  product_code: String,
  unit_price: Number,
  quantity: Number,
  gst_percent: Number,
  gst_amount: Number,
  total: Number,
});

const saleSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },
    // store_category_id: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "StoreCategoryCustom", 
    //   required: true, 
    // },
    saleDate: { type: Date, default: Date.now },
    customerName: String,
    customerMobile: String,
    totalGst: Number,
    totalAmount: Number,
    products: [productSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Sales", saleSchema);

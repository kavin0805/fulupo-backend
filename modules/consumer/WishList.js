import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Consumer", required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: true }
);

// Ensure unique wishlist per customer-store-product combo
wishlistSchema.index({ customerId: 1, storeId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);

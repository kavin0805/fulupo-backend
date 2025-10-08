import WishList from "../../modules/consumer/WishList.js";

// Add to wishlist
export const addWishlist = async (req, res) => {
  try {
    const { customerId, storeId, productId } = req.body;

    if (!customerId || !storeId || !productId) {
      return res.status(400).json({ message: "customerId, storeId, and productId are required" });
    }

    const wishlist = await WishList.findOneAndUpdate(
      { customerId, storeId, productId },
      { customerId, storeId, productId },
      { new: true, upsert: true } // create if not exists
    );

    res.json({ message: "Added to wishlist", data: wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error adding wishlist", error: err.message });
  }
};

// Remove from wishlist
export const removeWishlist = async (req, res) => {
  try {
    const { customerId, storeId, productId } = req.body;

    const deleted = await WishList.findOneAndDelete({ customerId, storeId, productId });

    if (!deleted) return res.status(404).json({ message: "Item not found in wishlist" });

    res.json({ message: "Removed from wishlist" });
  } catch (err) {
    res.status(500).json({ message: "Error removing wishlist", error: err.message });
  }
};

// Get wishlist for a customer & store
export const getWishlist = async (req, res) => {
  try {
    const { customerId, storeId } = req.body;

    const wishlist = await WishList.find({ customerId, storeId })
      .populate("productId", "name description productImage price category");

    res.json({ data: wishlist });
  } catch (err) {
    res.status(500).json({ message: "Error fetching wishlist", error: err.message });
  }
};

import express from "express";
import { addWishlist, getWishlist, removeWishlist } from "../../controllers/consumer/wishListController";

const router = express.Router();

router.post("/add", addWishlist);          // Add to wishlist
router.post("/remove", removeWishlist);    // Remove from wishlist
router.post("/getWishList", getWishlist); // Get wishlist

export default router;

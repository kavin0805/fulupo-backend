import express from "express";
import { addWishlist, getWishlist, removeWishlist } from "../../controllers/consumer/wishListController.js";
import { consumerAuth } from "../../middleware/consumerAuth.js";

const router = express.Router();

router.post("/add", consumerAuth , addWishlist);          // Add to wishlist
router.post("/remove", consumerAuth , removeWishlist);    // Remove from wishlist
router.post("/getWishList", consumerAuth , getWishlist); // Get wishlist

export default router;

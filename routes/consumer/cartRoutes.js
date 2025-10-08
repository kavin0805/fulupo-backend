import express from "express";
import { consumerAuth } from "../../middleware/consumerAuth.js";
import { addToCart, getCart, removeFromCart, updateCartQuantity } from "../../controllers/consumer/cartController.js";

const router = express.Router();

router.post("/add", consumerAuth, addToCart);
router.get("/getList", consumerAuth, getCart);
router.post("/remove", consumerAuth, removeFromCart);
router.post("/update", consumerAuth, updateCartQuantity);
     
export default router;

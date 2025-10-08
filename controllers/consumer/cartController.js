import Cart from "../../modules/consumer/Cart.js";

// Add/Update item in cart
export const addToCart = async (req, res) => {  
  try {
    const { storeId, productId, quantity } = req.body;
    const consumerId = req.consumer._id; // from auth middleware

    if (!storeId || !productId || !quantity) {
      return res.status(400).json({ message: "storeId, productId, and quantity are required" });
    }

    let cart = await Cart.findOne({ consumerId });

    if (!cart) {
      // create new cart
      cart = new Cart({
        consumerId,
        items: [{ storeId, productId, quantity }]
      });
    } else {
      // check if product already in cart
      const existingItem = cart.items.find(
        (item) => item.productId.toString() === productId && item.storeId.toString() === storeId
      );

      if (existingItem) {
        existingItem.quantity += quantity; // update qty
      } else {
        cart.items.push({ storeId, productId, quantity });
      }
    }

    await cart.save();
    return res.json({ message: "Product added to cart", cart });
  } catch (err) {
    return res.status(500).json({ message: "Error adding to cart", error: err.message });
  }
};

// Get consumer cart
export const getCart = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const cart = await Cart.findOne({ consumerId }).populate("items.productId").populate("items.storeId");

    if (!cart) return res.json({ message: "Cart is empty", items: [] });

    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching cart", error: err.message });
  }
};

// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId, storeId } = req.body;
    const consumerId = req.consumer._id;

    const cart = await Cart.findOne({ consumerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.storeId.toString() === storeId)
    );

    await cart.save();
    return res.json({ message: "Product removed from cart", cart });
  } catch (err) {
    return res.status(500).json({ message: "Error removing product", error: err.message });
  }
};

// Update product quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId, storeId, quantity } = req.body;
    const consumerId = req.consumer._id;

    const cart = await Cart.findOne({ consumerId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.productId.toString() === productId && i.storeId.toString() === storeId
    );

    if (!item) return res.status(404).json({ message: "Product not in cart" });

    item.quantity = quantity;
    await cart.save();

    return res.json({ message: "Cart updated", cart });
  } catch (err) {
    return res.status(500).json({ message: "Error updating cart", error: err.message });
  }
};

import Order from "../../modules/consumer/Order.js";
import Replacement from "../../modules/consumer/Replacement.js";
import Inventory from "../../modules/FulupoStore/Inventory.js";
import Product from "../../modules/storeAdmin/Product.js";

export const requestReplacement = async (req, res) => {
  try {
    const { orderId, productId, reason, quantity } = req.body;
    const customerId = req.consumer._id; // middleware sets req.user

    // ✅ Verify order exists
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // ✅ Get uploaded image paths (from Multer)
    const imagePaths = req.files?.map((file) => file.path) || [];

    // ✅ Create new replacement request
    const replacement = await Replacement.create({
      orderId,
      productId,
      customerId,
      storeId: order.storeId, 
      reason,
      images: imagePaths,
      quantity: quantity || 1,
    });

    res.status(201).json({
      success: true,
      message: "Replacement request submitted successfully",
      replacement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllReplacements = async (req, res) => {
  try {
    const replacements = await Replacement.find()
      .populate("orderId")
      .populate("productId")
      .populate("customerId", "name email");

    res.status(200).json({ success: true, replacements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReplacementsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const replacements = await Replacement.find({ customerId })
      .populate("productId")
      .populate("orderId");

    res.status(200).json({ success: true, replacements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateReplacementStatus = async (req, res) => {
  try {
    const { replacementId, status, adminComment } = req.body; // status: Approved / Rejected

    const replacement = await Replacement.findById(replacementId)
      .populate("orderId")
      .populate("customerId")
      .populate("storeId")
      .populate("productId");

    if (!replacement)
      return res.status(404).json({ message: "Replacement not found" });

    replacement.status = status;
    replacement.adminComment = adminComment;
    await replacement.save();

    // ✅ If approved, create a replacement order
    if (status === "Approved") {
      const originalOrder = replacement.orderId;
      const storeId = replacement.storeId._id;
      const customerId = replacement.customerId._id;
      const addressId = originalOrder.addressId;
      const product = replacement.productId;

      // 🧮 Reduce inventory and product stock
      const inventory = await Inventory.findOne({
        storeId,
        product_id: product._id,
      });

      if (!inventory || inventory.quantity < replacement.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      inventory.quantity -= replacement.quantity;
      inventory.percentage = (
        (inventory.quantity / inventory.totalQty) *
        100
      ).toFixed(2);
      await inventory.save();

      product.showAvlQty -= replacement.quantity;
      await product.save();

      // ✅ Create a replacement order (totalAmount = 0)
      const replacementOrder = await Order.create({
        consumerId: customerId, // or customerId depending on your Order schema
        storeId,
        addressId,
        items: [
          {
            productId: product._id,
            quantity: replacement.quantity,
          },
        ],
        totalAmount: 0,
        paymentMode: "Replacement",
        paymentStatus: "Completed",
        orderType: "Replacement",
        parentOrderId: originalOrder._id,
      });

      replacement.replacementOrderId = replacementOrder._id;
      replacement.status = "Replaced";
      await replacement.save();
    }

    res.status(200).json({
      success: true,
      message:
        status === "Approved"
          ? "Replacement approved and order created successfully."
          : "Replacement status updated successfully.",
      replacement,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteReplacement = async (req, res) => {
  try {
    const { id } = req.params;
    await Replacement.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Replacement deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

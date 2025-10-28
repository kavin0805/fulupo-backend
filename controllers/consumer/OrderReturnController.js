import Order from "../../modules/consumer/Order.js";
import OrderReturn from "../../modules/consumer/OrderReturn.js";
import Product from "../../modules/product/Product.js";
import Inventory from "../../modules/inventory/Inventory.js";
import path from "path";
import fs from "fs";

// 🟢 Create Return Request (with images)
export const createReturn = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { orderId, products, reason } = req.body;
    const imageFiles = req.files ? req.files.map(file => file.path.replace(/\\/g, "/")) : [];

    if (!orderId || !products?.length || !reason)
      return res.status(400).json({ message: "Missing required fields" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let refundAmount = 0;
    const returnItems = [];

    for (const p of products) {
      const orderItem = order.items.find(i => i.product_id.toString() === p.product_id);
      if (!orderItem)
        return res.status(400).json({ message: `Product not found in order: ${p.product_id}` });

      refundAmount += orderItem.unit_price * p.quantity;

      returnItems.push({
        product_id: p.product_id,
        product_name: orderItem.product_name,
        quantity: p.quantity,
        price: orderItem.unit_price,
      });
    }

    const orderReturn = await OrderReturn.create({
      orderId,
      consumerId,
      storeId: order.storeId,
      reason,
      refundAmount,
      products: returnItems,
      images: imageFiles,
    });

    res.status(201).json({ message: "Return request created", orderReturn });
  } catch (err) {
    res.status(500).json({ message: "Error creating return", error: err.message });
  }
};

// 🟠 Approve/Reject Return (Admin / Store)
export const updateReturnStatus = async (req, res) => {
  try {
    const { returnId } = req.params;
    const { status, remarks } = req.body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const orderReturn = await OrderReturn.findById(returnId);
    if (!orderReturn) return res.status(404).json({ message: "Return not found" });

    orderReturn.status = status;
    orderReturn.remarks = remarks || "";

    if (status === "Approved") {
      // Restock products & update inventory
      for (const item of orderReturn.products) {
        const product = await Product.findById(item.product_id);
        if (product) {
          product.showAvlQty += item.quantity;
          await product.save();
        }

        const inventory = await Inventory.findOne({
          storeId: orderReturn.storeId,
          product_id: item.product_id,
        });
        if (inventory) {
          inventory.quantity += item.quantity;
          inventory.percentage = ((inventory.quantity / inventory.totalQty) * 100).toFixed(2);
          await inventory.save();
        }
      }
    }

    await orderReturn.save();
    res.json({ message: `Return ${status.toLowerCase()} successfully`, orderReturn });
  } catch (err) {
    res.status(500).json({ message: "Error updating return status", error: err.message });
  }
};

// 🟢 Get Single Return
export const getReturnById = async (req, res) => {
  try {
    const { returnId } = req.params;
    const consumerId = req.consumer._id;

    const orderReturn = await OrderReturn.findOne({ _id: returnId, consumerId })
      .populate("orderId")
      .populate("storeId", "name");

    if (!orderReturn) return res.status(404).json({ message: "Return not found" });

    res.json({ orderReturn });
  } catch (err) {
    res.status(500).json({ message: "Error fetching return", error: err.message });
  }
};

// 🟡 Get All Returns by Consumer
export const getMyReturns = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const returns = await OrderReturn.find({ consumerId })
      .populate("storeId", "name")
      .sort({ createdAt: -1 });

    res.json({ count: returns.length, returns });
  } catch (err) {
    res.status(500).json({ message: "Error fetching returns", error: err.message });
  }
};

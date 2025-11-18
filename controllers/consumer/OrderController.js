import crypto from "crypto";
import Order from '../../modules/consumer/Order.js'
import {razorpayInstance} from '../../utils/razorpay.js'
import Inventory from '../../modules/FulupoStore/Inventory.js'
import Product from '../../modules/storeAdmin/Product.js'

// 🧾 Create Order (COD or Razorpay)
// export const createOrder = async (req, res) => {
//   try {
//     const consumerId = req.consumer._id;
//     const { storeId, addressId, items, totalAmount, paymentMode } = req.body;

//     if (!storeId || !addressId || !items?.length || !totalAmount || !paymentMode)
//       return res.status(400).json({ message: "Missing required fields" });

//     if (paymentMode === "COD") {
//       // Directly create order
//       const order = await Order.create({
//         consumerId,
//         storeId,
//         addressId,
//         items,
//         totalAmount,
//         paymentMode,
//         paymentStatus: "Pending",
//       });

//       return res.json({ message: "Order placed successfully (COD)", order });
//     }

//     // Razorpay flow
//     const options = {
//       amount: Math.round(totalAmount * 100), // convert to paise
//       currency: "INR",
//       receipt: `order_rcpt_${Date.now()}`,
//     };

//     const razorpayOrder = await razorpayInstance.orders.create(options);

//     const order = await Order.create({
//       consumerId,
//       storeId,
//       addressId,
//       items,
//       totalAmount,
//       paymentMode: "Razorpay",
//       paymentStatus: "Pending",
//       razorpayOrderId: razorpayOrder.id,
//     });

//     res.json({
//       message: "Razorpay order created",
//       order,
//       razorpayOrder,
//       key: process.env.RAZORPAY_KEY_ID,
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Error creating order", error: err.message });
//   }
// };


export const createOrder = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { storeId, addressId, items, totalAmount, paymentMode } = req.body;

    if (!storeId || !addressId || !items?.length || !totalAmount || !paymentMode)
      return res.status(400).json({ message: "Missing required fields" });

    // 🧮 Reduce Product & Inventory Quantity (common for all order types)
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      

      if (!product) throw new Error(`Product not found: ${item.productId}`);

      // Find store inventory
      const inventory = await Inventory.findOne({
        storeId,
        product_id: product._id,
      });
      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      // Reduce quantity in inventory
      inventory.quantity -= item.quantity;
      inventory.percentage = (
        (inventory.quantity / inventory.totalQty) *
        100
      ).toFixed(2);
      await inventory.save();

      // Reduce available quantity in product
      product.showAvlQty -= item.quantity;
      await product.save();
    }

    // 💵 COD flow
    if (paymentMode === "COD") {
      const order = await Order.create({
        consumerId,
        storeId,
        addressId,
        items,
        totalAmount,
        paymentMode,
        paymentStatus: "Pending",
      });

      return res.json({ message: "Order placed successfully (COD)", order });
    }

    // 💳 Razorpay flow
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const order = await Order.create({
      consumerId,
      storeId,
      addressId,
      items,
      totalAmount,
      paymentMode: "Razorpay",
      paymentStatus: "Pending",
      razorpayOrderId: razorpayOrder.id,
    });

    res.json({
      message: "Razorpay order created",
      order,
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ message: "Error creating order", error: err.message });
  }
};


// ✅ Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const order = await Order.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          paymentStatus: "Paid",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
        { new: true }
      );

      return res.json({ message: "Payment verified successfully", order });
    }

    res.status(400).json({ message: "Invalid signature, payment verification failed" });
  } catch (err) {
    res.status(500).json({ message: "Error verifying payment", error: err.message });
  }
};


// 📦 Get All Orders for a Consumer
export const getMyOrders = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const orders = await Order.find({ consumerId })
      .populate("storeId", "name")
      .populate("addressId")
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};


// 📄 Get Single Order by ID
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const consumerId = req.consumer._id; // from auth

    const order = await Order.findOne({ _id: orderId, consumerId })
      .populate("storeId", "name address phone")
      .populate("addressId")
      .populate("items.product_id", "name image discountPrice mrpPrice");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order fetched successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Error fetching order", error: err.message });
  }
};


export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId , status} = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = status;
    await order.save();

    res.json({ message: "Payment status updated", order });
  } catch (err) {
    res.status(500).json({ message: "Error updating payment status", error: err.message });
  }
};

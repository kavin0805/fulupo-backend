import crypto from "crypto";
import Order from "../../modules/consumer/Order.js";
import { razorpayInstance } from "../../utils/razorpay.js";
import Inventory from "../../modules/FulupoStore/Inventory.js";
import Product from "../../modules/storeAdmin/Product.js";
import StoreDeliverySlot from "../../modules/storeAdmin/storeDeliverySlot.js";
import mongoose from "mongoose";
import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);


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

// function to generate delivery pin
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// list the available slots to place an order
export const listAvailableSlots = async (req, res) => {
  try {
    const { storeId: storeIdFromQuery } = req.query;

    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    if (!date) return res.status(400).json({ message: "date is required" });

    // Resolve consumer's storeId
    let consumerStoreId = req.consumer?.storeId;
    if (!consumerStoreId) {
      const me = await Consumer.findById(req.consumer._id).select("storeId");
      if (!me?.storeId)
        return res
          .status(403)
          .json({ message: "Consumer is not linked to any store" });
      consumerStoreId = me.storeId.toString();
    }

    // If a storeId was sent, ensure it matches the consumer's store
    if (storeIdFromQuery && storeIdFromQuery !== String(consumerStoreId)) {
      return res
        .status(403)
        .json({
          message: "Forbidden: storeId does not match consumer's store",
        });
    }

    // use the consumer's storeId for querying
    const slots = await StoreDeliverySlot.find({
      storeId: consumerStoreId,
      date,
      isActive: true,
      $expr: { $lt: ["$bookedCount", "$capacity"] },
    }).sort({ start: 1 });

    res.json({ Slots: slots });
  } catch (e) {
    res.status(500).json({ message: "List error", error: e.message });
  }
};

// place the order on the selected slot
export const PlaceOrderWithSlot = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const consumerId = req.consumer._id;
    const {
      storeId,
      addressId,
      items,
      totalAmount,
      paymentMode,
      start,
      end,
    } = req.body;

    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    if (
      !storeId ||
      !addressId ||
      !items?.length ||
      !totalAmount ||
      !paymentMode ||
      !start ||
      !end
    )
      return res.status(400).json({ message: "Missing required fields" });

    // Reduce Product & Inventory Quantity (common for all order types)
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);

      item.name = product.name;
      item.image = product.dimenstionImages?.[0] || null;
      
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

    // Try to reserve the slot
    const slot = await StoreDeliverySlot.findOneAndUpdate(
      {
        storeId,
        date,
        start,
        end,
        isActive: true,
        $expr: { $lt: ["$bookedCount", "$capacity"] },
      },
      { $inc: { bookedCount: 1 } },
      { new: true, session }
    );

    if (!slot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: "Slot full or inactive now" });
    }

    // Generate Delivery PIN
    const deliveryPin = generatePin();

    // COD flow
    if (paymentMode === "COD") {
      const order = await Order.create(
        [
          {
            consumerId,
            storeId,
            addressId,
            items,
            totalAmount,
            paymentMode,
            paymentStatus: "Pending",
            slotId: slot._id,
            slotDate: date,
            slotStart: start,
            slotEnd: end,
            deliveryPin,
            orderStatus: "PENDING_STORE_APPROVAL",
          },
        ],
        { session }
      );
      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Order placed (COD)",
        order: order[0],
        pinPreview: deliveryPin,
      });
    }

    // Razorpay flow
    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const order = await Order.create(
      [
        {
          consumerId,
          storeId,
          addressId,
          items,
          totalAmount,
          paymentMode: "Razorpay",
          paymentStatus: "Pending",
          razorpayOrderId: razorpayOrder.id,
          slotId: slot._id,
          slotDate: date,
          slotStart: start,
          slotEnd: end,
          deliveryPin,
          orderStatus: "PENDING_STORE_APPROVAL",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: "Razorpay order created",
      order: order[0],
      razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
      pinPreview: deliveryPin,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res
      .status(500)
      .json({ message: "Error creating order", error: err.message });
  }
};

// ✅ Verify Razorpay Payment
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

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

    res
      .status(400)
      .json({ message: "Invalid signature, payment verification failed" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error verifying payment", error: err.message });
  }
};

// Get All Orders for a Consumer
export const getMyOrders = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const orders = await Order.find({ consumerId })
      .populate("storeId", "name")
      .populate("addressId")
      .sort({ createdAt: -1 });

    res.json({ count: orders.length, orders });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: err.message });
  }
};

// Get Single Order by ID
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
    res
      .status(500)
      .json({ message: "Error fetching order", error: err.message });
  }
};

// update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.paymentStatus = status;
    await order.save();

    res.json({ message: "Payment status updated", order });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating payment status", error: err.message });
  }
};

// rate the delivery person
export const rateDelivery = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { orderId, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const order = await Order.findOne({
      _id: orderId,
      consumerId,
      orderStatus: "DELIVERED",
    });

    if (!order)
      return res.status(400).json({ message: "Order not delivered yet, can't rate" });

    if (!order.deliveryPersonId)
      return res.status(400).json({ message: "No delivery person assigned" });

    if (order.deliveryRating) {
      return res.status(400).json({
        message: "You have already rated this delivery"
      });
    }

    // Save rating to order
    order.deliveryRating = rating;
    await order.save();

    const dp = await DeliveryPerson.findById(order.deliveryPersonId);
    if (!dp)
      return res.status(404).json({ message: "Delivery person not found" });

    // Update DP rating average using O(1) formula
    const totalRatings = dp.ratingCount || 0;
    const newAverage =
      ((dp.averageRating || 0) * totalRatings + rating) / (totalRatings + 1);

    dp.averageRating = Number(newAverage.toFixed(2));
    dp.ratingCount = totalRatings + 1;

    await dp.save();

    res.json({
      message: "Thank you for rating!",
      rating,
      newAverage: dp.averageRating,
    });

  } catch (err) {
    res.status(500).json({ message: "Rating error", error: err.message });
  }
};



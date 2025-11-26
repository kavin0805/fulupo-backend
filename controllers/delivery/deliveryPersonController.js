import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import Order from "../../modules/consumer/Order.js";
import dayjs from "dayjs";
import pushDeliveryNotification from "../../utils/deliveryNotificationHelper.js";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween); // enable the plugin
import isoWeek from "dayjs/plugin/isoWeek.js";
dayjs.extend(isoWeek);

// Get my profile
export const getMyProfile = async (req, res) => {
  try {
    const me = await DeliveryPerson.findById(req.deliveryPerson._id);
    if (!me) return res.status(404).json({ message: "Profile not found" });
    res.json(me);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching profile", error: err.message });
  }
};

// Update my profile
export const updateMyProfile = async (req, res) => {
  try {
    const allowed = [
      "profileImage",
      "vehicleNumber",
      "vehiclePhoto",
      "rcNumber",
      "rcImage",
      "insuranceNumber",
      "insuranceImage",
      "aadharNumber",
      "aadharImage",
      "drivingLicenseNumber",
      "drivingLicenseImage",
      "otherDocuments",
      "bankName",
      "accountNumber",
      "ifscCode",
      "branch",
      "passbookImage",
    ];

    const update = {};

    // Handle text fields
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    // Handle file uploads using multer
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        update[key] = req.files[key][0].path; // storing the file path
      });
    }

    // Update delivery person's data
    const updated = await DeliveryPerson.findByIdAndUpdate(
      req.deliveryPerson._id,
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile updated successfully", data: updated });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: err.message });
  }
};

// order accept/reject function
export const respondToOrder = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId, action, rejectionReason } = req.body; // <-- PATCHED

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId)) {
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });
    }

    // // Prevent duplicate responses
    if (
      ["DELIVERED", "REJECTED_BY_DP", "OUT_FOR_DELIVERY"].includes(
        order.orderStatus
      )
    ) {
      return res.status(400).json({
        message: `Order already ${order.orderStatus
          .replace(/_/g, " ")
          .toLowerCase()}`,
      });
    }

    const today = dayjs().format("YYYY-MM-DD");
    const dp = await DeliveryPerson.findById(dpId);

    // // Reset daily rejection counter
    if (dp.rejectionCountDate !== today) {
      dp.rejectionCountDate = today;
      dp.rejectionCount = 0;
    }

    // REJECT flow
    if (action === "REJECT") {
      if (dp.rejectionCount >= dp.rejectionLimitPerDay) {
        return res
          .status(403)
          .json({ message: "Daily rejection limit reached" });
      }

      dp.rejectionCount += 1;
      await dp.save();
      order.orderStatus = "REJECTED_BY_DP";
      order.rejectionReason = rejectionReason || null;
      order.rejectedAt = new Date();
      await order.save();

      // Push notification (DB + Socket)
      await pushDeliveryNotification({
        deliveryPersonId: dpId,
        storeId: order.storeId,
        orderId: order._id,
        type: "StatusRejected",
        title: "Delivery Rejected",
        message: `Order #${
          order.orderNumber?.slice(-4) || order._id.toString().slice(-4)
        } rejected. You've used ${dp.rejectionCount}/${
          dp.rejectionLimitPerDay
        } rejections today.`,
      });

      return res.json({ message: "Order rejected successfully" });
    }

    // ACCEPT flow
    order.orderStatus = "OUT_FOR_DELIVERY";
    await order.save();

    res.json({ message: "Order accepted successfully", order });
  } catch (err) {
    console.error("DP response error:", err);
    res.status(500).json({ message: "DP response error", error: err.message });
  }
};

// get order details
export const getOrderDetails = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const order = await Order.findOne({
      _id: orderId,
      deliveryPersonId: dpId,
    })
      .populate("consumerId", "name mobile")
      .populate("addressId", "addressLine addressName addressType")
      .populate("items.productId", "name")
      .populate("storeId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found or not assigned to you",
      });
    }

    // BLOCK if already delivered
    if (order.orderStatus === "DELIVERED") {
      return res.status(403).json({
        message:
          "This order has already been delivered. Details are no longer available.",
      });
    }

    // Extract store fields safely
    const store = order.storeId || {};
    const storeName = store.store_name;
    const storeAddress = store.store_address;

    // cleaner response
    const clean = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      slot: {
        date: order.slotDate,
        start: order.slotStart,
        end: order.slotEnd,
      },
      consumer: {
        name: order.consumerId?.name,
        mobile: order.consumerId?.mobile,
      },
      address: order.addressId
        ? {
            line: order.addressId.addressLine,
            label: order.addressId.addressName,
            type: order.addressId.addressType,
          }
        : null,
      items: order.items.map((i) => ({
        productId: i.productId?._id,
        name: i.productId?.name || i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      orderStatus: order.orderStatus,

      store: {
        name: storeName,
        address: storeAddress,
      },
    };

    return res.json({ data: clean });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching order details",
      error: err.message,
    });
  }
};

// Delivery completion controller
export const completeDelivery = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId, pin } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId)) {
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });
    }

    // Prevent re-delivery update
    if (order.orderStatus === "DELIVERED") {
      return res.status(400).json({ message: "Order already delivered" });
    }

    if (order.deliveryPin !== pin)
      return res.status(400).json({ message: "Invalid delivery PIN" });

    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();
    await order.save();

    // Push notification (DB + Socket)
    await pushDeliveryNotification({
      deliveryPersonId: dpId,
      storeId: order.storeId,
      orderId: order._id,
      type: "StatusDelivered",
      title: "Delivery Completed",
      message: `Order #${
        order.orderNumber?.slice(-4) || order._id.toString().slice(-4)
      } successfully delivered.`,
    });

    res.json({ message: "Delivery completed successfully" });
  } catch (err) {
    console.error("Delivery complete error:", err);
    res
      .status(500)
      .json({ message: "Delivery complete error", error: err.message });
  }
};

// Get today's overview (to be delivered + delivered)
export const getTodayOverview = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const today = dayjs().format("YYYY-MM-DD");

    const orders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: { $in: ["OUT_FOR_DELIVERY", "DELIVERED"] },
    })
      .populate("consumerId", "name mobile")
      .populate("addressId", "addressLine addressName addressType")
      .populate("items.productId", "name");

    // fetch rejected orders for today
    const rejectedOrders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: "REJECTED_BY_DP",
      rejectedAt: { $exists: true, $ne: null },
    })
      .populate("consumerId", "name mobile")
      .populate("addressId", "addressLine addressName addressType");

    const todayRejected = rejectedOrders.filter((o) =>
      dayjs(o.rejectedAt).isSame(today, "day")
    );

    const toBeDelivered = orders.filter(
      (o) => o.orderStatus === "OUT_FOR_DELIVERY" && o.slotDate === today
    );

    const delivered = orders.filter(
      (o) =>
        o.orderStatus === "DELIVERED" &&
        o.deliveredAt &&
        dayjs(o.deliveredAt).isSame(today, "day")
    );

    const clean = (o) => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      slot: {
        date: o.slotDate,
        start: o.slotStart,
        end: o.slotEnd,
      },
      consumer: o.consumerId
        ? { name: o.consumerId.name, mobile: o.consumerId.mobile }
        : null,
      address: o.addressId
        ? {
            line: o.addressId.addressLine,
            label: o.addressId.addressName,
            type: o.addressId.addressType,
          }
        : null,
      items: o.items.map((i) => ({
        productId: i.productId?._id || i.productId,
        name: i.productId?.name || i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),
      totalAmount: o.totalAmount,
      paymentMode: o.paymentMode,
      orderStatus: o.orderStatus,
      deliveredAt: o.deliveredAt || null,
    });

    // to get only rejection details
    const cleanRejected = (o) => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      rejectedAt: o.rejectedAt,
      rejectionReason: o.rejectionReason || null,
      consumer: o.consumerId
        ? { name: o.consumerId.name, mobile: o.consumerId.mobile }
        : null,
    });

    res.json({
      date: today,
      totalOrders: toBeDelivered.length + delivered.length,
      toBeDelivered: toBeDelivered.length,
      delivered: delivered.length,
      rejections: todayRejected.length,
      toBeDeliveredOrders: toBeDelivered.map(clean),
      deliveredOrders: delivered.map(clean),
      rejectedOrders: todayRejected.map(cleanRejected),
      allTodayOrders: [...toBeDelivered, ...delivered].map(clean),
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching today's overview",
      error: err.message,
    });
  }
};

// Get order history with filters (date + status)
export const getOrderHistory = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const {
      startDate,
      endDate,
      date,
      status,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { deliveryPersonId: dpId };

    // DATE FILTER
    if (date) {
      // Exact match
      filter.slotDate = date;
    } else if (startDate && endDate) {
      // Between two dates
      filter.slotDate = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      // From start date to ANY future
      filter.slotDate = { $gte: startDate };
    } else if (endDate) {
      // Up to the end date
      filter.slotDate = { $lte: endDate };
    }

    if (status) {
      filter.orderStatus = status;
    } else {
      filter.orderStatus = { $in: ["DELIVERED", "REJECTED_BY_DP"] };
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(filter)
      .populate("consumerId", "name mobile")
      .populate("addressId", "addressLine addressName addressType")
      .populate("items.productId", "name")
      .sort({ deliveredAt: -1, rejectedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // count for pagination
    const totalOrders = await Order.countDocuments(filter);

    // cleaner data structure
    const cleanData = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,

      slot: {
        date: order.slotDate,
        start: order.slotStart,
        end: order.slotEnd,
      },

      consumer: order.consumerId
        ? {
            name: order.consumerId.name,
            mobile: order.consumerId.mobile,
          }
        : null,

      address: order.addressId
        ? {
            line: order.addressId.addressLine,
            label: order.addressId.addressName,
            type: order.addressId.addressType,
          }
        : null,

      items: order.items.map((i) => ({
        productId: i.productId?._id || i.productId,
        name: i.productId?.name || i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.total,
      })),

      totalAmount: order.totalAmount,
      paymentMode: order.paymentMode,
      orderStatus: order.orderStatus,
      deliveredAt: order.deliveredAt || null,
      rejectedAt: order.rejectedAt || null,
      rejectionReason: order.rejectionReason || null,
    }));

    // order count based on filter
    const deliveriesInRange = await Order.countDocuments({
      ...filter,
      orderStatus: "DELIVERED",
    });

    const rejectionsInRange = await Order.countDocuments({
      ...filter,
      orderStatus: "REJECTED_BY_DP",
    });
    
    res.json({
      page: Number(page),
      limit: Number(limit),
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      deliveriesInRange,
      rejectionsInRange, 
      data: cleanData,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching order history",
      error: err.message,
    });
  }
};

// Get delivery performance metrics (daily, weekly, monthly, total)
export const getDeliveryMetrics = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;

    const dp = await DeliveryPerson.findById(dpId);
    if (!dp) {
      return res.status(404).json({ message: "Delivery person not found" });
    }

    // Fetch ONLY delivered orders with a valid deliveredAt timestamp
    const allDeliveredOrders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: "DELIVERED",
      deliveredAt: { $exists: true, $ne: null },
    }).lean();

    // FETCH only rejected orders with a valid rejectedAt timestamp
    const rejectedOrders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: "REJECTED_BY_DP",
      rejectedAt: { $exists: true, $ne: null },
    }).lean();

    const today = dayjs();
    const startOfWeek = today.startOf("isoWeek");
    const endOfWeek = today.endOf("isoWeek");
    const startOfMonth = today.startOf("month");
    const endOfMonth = today.endOf("month");
    const perDeliveryEarning = dp.earningsPerDelivery || 0;

    // helper for day js functions for delivered metrics
    const isDeliveredToday = (o) =>
      o.deliveredAt && dayjs(o.deliveredAt).isSame(today, "day");

    const isDeliveredThisWeek = (o) =>
      o.deliveredAt &&
      dayjs(o.deliveredAt).isBetween(startOfWeek, endOfWeek, "day", "[]");

    const isDeliveredThisMonth = (o) =>
      o.deliveredAt &&
      dayjs(o.deliveredAt).isBetween(startOfMonth, endOfMonth, "day", "[]");

    // helper for day js functions for rejected metrics
    const isRejectedToday = (o) =>
      o.rejectedAt && dayjs(o.rejectedAt).isSame(today, "day");

    const isRejectedThisWeek = (o) =>
      o.rejectedAt &&
      dayjs(o.rejectedAt).isBetween(startOfWeek, endOfWeek, "day", "[]");

    const isRejectedThisMonth = (o) =>
      o.rejectedAt &&
      dayjs(o.rejectedAt).isBetween(startOfMonth, endOfMonth, "day", "[]");

    // Calculations
    const todayDeliveries = allDeliveredOrders.filter(isDeliveredToday).length;
    const weekDeliveries =
      allDeliveredOrders.filter(isDeliveredThisWeek).length;
    const monthDeliveries =
      allDeliveredOrders.filter(isDeliveredThisMonth).length;
    const totalDeliveries = allDeliveredOrders.length;
    const todayRejections = rejectedOrders.filter(isRejectedToday).length;
    const weekRejections = rejectedOrders.filter(isRejectedThisWeek).length;
    const monthRejections = rejectedOrders.filter(isRejectedThisMonth).length;
    const totalRejections = rejectedOrders.length;

    //WEEKLY BREAKDOWN (Sun–Sat) ---
    const weekBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, "day");

      const dayCount = allDeliveredOrders.filter(
        (o) => o.deliveredAt && dayjs(o.deliveredAt).isSame(day, "day")
      ).length;

      weekBreakdown.push({
        day: day.format("ddd"), // Sun, Mon, Tue, ...
        date: day.format("YYYY-MM-DD"),
        deliveries: dayCount,
        earnings: dayCount * perDeliveryEarning,
      });
    }

    // MONTHLY BREAKDOWN
    const monthBreakdown = [];
    let cursor = startOfMonth.clone();
    let weekIndex = 1;

    while (cursor.isBefore(endOfMonth) || cursor.isSame(endOfMonth, "day")) {
      const weekStart = cursor.clone();

      // Add 6 days but make sure it stays inside month
      let weekEnd = weekStart.clone().add(6, "day");
      if (weekEnd.isAfter(endOfMonth)) {
        weekEnd = endOfMonth.clone();
      }

      // Count deliveries in this week segment
      const weekCount = allDeliveredOrders.filter(
        (o) =>
          o.deliveredAt &&
          dayjs(o.deliveredAt).isBetween(weekStart, weekEnd, "day", "[]")
      ).length;

      monthBreakdown.push({
        week: `Week ${weekIndex}`,
        start: weekStart.format("YYYY-MM-DD"),
        end: weekEnd.format("YYYY-MM-DD"),
        deliveries: weekCount,
        earnings: weekCount * perDeliveryEarning,
      });

      // Move cursor to next day after this week
      cursor = weekEnd.clone().add(1, "day");
      weekIndex++;
    }

    res.json({
      today: {
        deliveries: todayDeliveries,
        earnings: todayDeliveries * perDeliveryEarning,
        rejections: todayRejections,
      },
      week: {
        deliveries: weekDeliveries,
        earnings: weekDeliveries * perDeliveryEarning,
        rejections: weekRejections,
        breakdown: weekBreakdown,
      },
      month: {
        deliveries: monthDeliveries,
        earnings: monthDeliveries * perDeliveryEarning,
        rejections: monthRejections,
        breakdown: monthBreakdown,
      },
      total: {
        deliveries: totalDeliveries,
        earnings: totalDeliveries * perDeliveryEarning,
        rejections: totalRejections,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: "Error calculating metrics",
      error: err.message,
    });
  }
};

// // payment logic to be implemented (Payment Credited notification)
// export const sendPaymentCreditedNotification = async (dpId, amount) => {
//   await pushDeliveryNotification({
//     deliveryPersonId: dpId,
//     type: "PaymentCredited",
//     title: "Payment Credited",
//     message: `Payout of ₹${amount} has been credited successfully.`,
//   });
// };

// // payment logic to be implemented (Payment Failed notification)
// export const sendPaymentFailedNotification = async (dpId, amount) => {
//   await pushDeliveryNotification({
//     deliveryPersonId: dpId,
//     type: "PaymentFailed",
//     title: "Payment Failed",
//     message: `Payout of ₹${amount} failed. Please contact support.`,
//   });
// };

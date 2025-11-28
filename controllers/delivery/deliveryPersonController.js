import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import Order from "../../modules/consumer/Order.js";
import dayjs from "dayjs";
import pushDeliveryNotification from "../../utils/deliveryNotificationHelper.js";
import isBetween from "dayjs/plugin/isBetween.js";
dayjs.extend(isBetween); // enable the plugin
import isoWeek from "dayjs/plugin/isoWeek.js";
import { assign } from "nodemailer/lib/shared/index.js";
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

// get order details
export const getOrderDetails = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ message: "orderId is required" });
    }

    const dp = await DeliveryPerson.findById(dpId).lean();
    const favoriteIds = dp?.favoriteConsumers?.map((id) => String(id)) || [];

    const order = await Order.findOne({
      _id: orderId,
      deliveryPersonId: dpId,
    })
      .populate("consumerId", "name mobile")
      .populate(
        "addressId",
        "addressLine addressName addressType lat long geolocation"
      )
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
    const storeLat = store.lat;
    const storeLong = store.long;
    const storeGeolocation = store.geolocation;

    // cleaner response
    const clean = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      fastDelivery: order.fastDelivery,
      deliveryCharge: order.deliveryCharge,
      assignedAt: order.updatedAt || null,
      slot: {
        date: order.slotDate,
        start: order.slotStart,
        end: order.slotEnd,
      },
      consumer: {
        name: order.consumerId?.name,
        mobile: order.consumerId?.mobile,
        isFavorite: favoriteIds.includes(String(order.consumerId._id)),
      },
      address: order.addressId
        ? {
            line: order.addressId.addressLine,
            label: order.addressId.addressName,
            type: order.addressId.addressType,
            lat: order.addressId.lat || null,
            long: order.addressId.long || null,
            geolocation: order.addressId.geolocation || null,
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
        lat: storeLat || null,
        long: storeLong || null,
        geolocation: storeGeolocation || null,
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

// function to toggle customer as favorite or not
export const toggleFavoriteCustomer = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { consumerId } = req.body;

    if (!consumerId) {
      return res.status(400).json({ message: "consumerId is required" });
    }

    const dp = await DeliveryPerson.findById(dpId);

    const index = dp.favoriteConsumers.findIndex(
      (id) => String(id) === String(consumerId)
    );

    if (index === -1) {
      dp.favoriteConsumers.push(consumerId);
      await dp.save();
      return res.json({
        message: "Customer added to favorites",
        isFavorite: true,
      });
    } else {
      dp.favoriteConsumers.splice(index, 1);
      await dp.save();
      return res.json({
        message: "Customer removed from favorites",
        isFavorite: false,
      });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating favorite", error: err.message });
  }
};

// order accept/reject function
export const respondToOrder = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId, action, rejectionReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId)) {
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });
    }

    // Reject Allowed only before pickup
    const rejectValidStatuses = ["ASSIGNED_TO_DP"];

    // Accept Allowed only if assigned
    const acceptValidStatuses = ["ASSIGNED_TO_DP"];

    // REJECT FLOW
    if (action === "REJECT") {
      if (!rejectValidStatuses.includes(order.orderStatus)) {
        return res.status(400).json({
          message: "Cannot reject in current status",
          currentStatus: order.orderStatus,
        });
      }
      if (!rejectionReason || rejectionReason.trim() === "") {
        return res
          .status(400)
          .json({ message: "Rejection reason is required" });
      }

      const todayStr = dayjs().format("YYYY-MM-DD");
      const dp = await DeliveryPerson.findById(dpId);

      if (dp.rejectionCountDate !== todayStr) {
        dp.rejectionCountDate = todayStr;
        dp.rejectionCount = 0;
      }

      if (dp.rejectionCount >= dp.rejectionLimitPerDay) {
        return res
          .status(403)
          .json({ message: "Daily rejection limit reached" });
      }

      dp.rejectionCount += 1;
      await dp.save();

      order.orderStatus = "REJECTED_BY_DP";
      order.rejectedAt = new Date();
      order.rejectionReason = rejectionReason || null;
      await order.save();

      await DeliveryPerson.updateOne(
        { _id: dpId },
        { $inc: { rejectedDeliveries: 1 } }
      );

      await pushDeliveryNotification({
        deliveryPersonId: dpId,
        storeId: order.storeId,
        orderId: order._id,
        type: "StatusRejected",
        title: "Delivery Rejected",
        message: `Order ${order.orderNumber?.slice(-4)} rejected. ${
          dp.rejectionCount
        }/${dp.rejectionLimitPerDay} today.`,
      });

      return res.json({ message: "Order rejected successfully" });
    }

    // ACCEPT FLOW
    if (action === "ACCEPT") {
      if (!acceptValidStatuses.includes(order.orderStatus)) {
        return res.status(400).json({
          message: "Cannot accept in current status",
          currentStatus: order.orderStatus,
        });
      }

      order.orderStatus = "ACCEPTED_BY_DP";
      await order.save();

      // pendingDelivery increments when accepted
      await DeliveryPerson.updateOne(
        { _id: dpId },
        { $inc: { pendingDeliveries: 1 } }
      );

      return res.json({ message: "Order accepted successfully", order });
    }

    return res.status(400).json({ message: "Invalid action" });
  } catch (err) {
    console.error("DP response error:", err);
    res.status(500).json({ message: "DP response error", error: err.message });
  }
};

// DP marks order as picked up from store - order status changes to picked up
export const pickUpOrder = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId)) {
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });
    }

    // Only allow from ACCEPTED_BY_DP
    if (order.orderStatus !== "ACCEPTED_BY_DP") {
      return res.status(400).json({
        message: "Cannot mark picked up in current status",
        currentStatus: order.orderStatus,
      });
    }

    order.orderStatus = "PICKED_UP";
    await order.save();

    return res.json({ message: "Order marked as picked up", order });
  } catch (err) {
    console.error("Pick-up error:", err);
    res.status(500).json({ message: "Pick-up error", error: err.message });
  }
};

// DP starts delivery - order status changes to OUT_FOR_DELIVERY
export const startDelivery = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId)) {
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });
    }

    // Only allow from PICKED_UP
    if (order.orderStatus !== "PICKED_UP") {
      return res.status(400).json({
        message: "Cannot start delivery in current status",
        currentStatus: order.orderStatus,
      });
    }

    order.orderStatus = "OUT_FOR_DELIVERY";
    await order.save();

    return res.json({ message: "Delivery started", order });
  } catch (err) {
    console.error("Start delivery error:", err);
    res.status(500).json({
      message: "Start delivery error",
      error: err.message,
    });
  }
};

// complete the delivery with pin from the consumer
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

    // Only allow completion from OUT_FOR_DELIVERY
    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
      return res.status(400).json({
        message: "Cannot complete delivery in current status",
        currentStatus: order.orderStatus,
      });
    }

    if (order.deliveryPin !== pin)
      return res.status(400).json({ message: "Invalid delivery PIN" });

    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();
    await order.save();

    // update dp counters
    const perEarning = req.deliveryPerson.earningsPerDelivery || 0;

    await DeliveryPerson.updateOne(
      { _id: dpId },
      {
        $inc: {
          completedDeliveries: 1,
          pendingDeliveries: -1,
          totalDeliveries: 1,
          totalEarnings: perEarning,
        },
      }
    );

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

// Get today's overview (to be delivered + delivered)// Get today's overview (to be delivered + delivered)
export const getTodayOverview = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const dp = await DeliveryPerson.findById(dpId).lean();
    const favoriteIds = dp?.favoriteConsumers?.map((id) => String(id)) || [];
    const today = dayjs().format("YYYY-MM-DD");

    const orders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: {
        $in: [
          "ASSIGNED_TO_DP",
          "ACCEPTED_BY_DP",
          "PICKED_UP",
          "OUT_FOR_DELIVERY",
          "DELIVERED",
        ],
      },
      slotDate: today,
    })
      .populate("consumerId", "name mobile")
      .populate(
        "addressId",
        "addressLine addressName addressType lat long geolocation"
      )
      .populate("items.productId", "name")
      .populate("storeId");

    const rejectedOrders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: "REJECTED_BY_DP",
      rejectedAt: { $exists: true, $ne: null },
    })
      .populate("consumerId", "name mobile")
      .populate(
        "addressId",
        "addressLine addressName addressType lat long geolocation"
      )
      .populate("storeId");

    const todayRejected = rejectedOrders.filter((o) =>
      dayjs(o.rejectedAt).isSame(today, "day")
    );

    const toBeDelivered = orders.filter((o) =>
      [
        "ASSIGNED_TO_DP",
        "ACCEPTED_BY_DP",
        "REJECTED_BY_DP",
        "PICKED_UP",
        "OUT_FOR_DELIVERY",
      ].includes(o.orderStatus)
    );

    const delivered = orders.filter(
      (o) =>
        o.orderStatus === "DELIVERED" &&
        o.deliveredAt &&
        dayjs(o.deliveredAt).isSame(today, "day")
    );

    const clean = (o) => {
      const store = o.storeId || {};
      return {
        orderId: o._id,
        orderNumber: o.orderNumber,
        fastDelivery: o.fastDelivery,
        deliveryCharge: o.deliveryCharge,
        assignedAt: o.updatedAt || null,
        slot: { date: o.slotDate, start: o.slotStart, end: o.slotEnd },
        consumer: o.consumerId
          ? {
              name: o.consumerId.name,
              mobile: o.consumerId.mobile,
              isFavorite: favoriteIds.includes(String(o.consumerId._id)),
            }
          : null,
        address: o.addressId
          ? {
              line: o.addressId.addressLine,
              label: o.addressId.addressName,
              type: o.addressId.addressType,
              lat: o.addressId.lat || null,
              long: o.addressId.long || null,
              geolocation: o.addressId.geolocation || null,
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
        store: {
          name: store.store_name || null,
          address: store.store_address || null,
          lat: store.lat || null,
          long: store.long || null,
          geolocation: store.geolocation || null,
        },
      };
    };

    const cleanRejected = (o) => {
      const store = o.storeId || {};
      return {
        orderId: o._id,
        orderNumber: o.orderNumber,
        fastDelivery: o.fastDelivery,
        deliveryCharge: o.deliveryCharge,
        assignedAt: o.updatedAt || null,
        slot: { date: o.slotDate, start: o.slotStart, end: o.slotEnd },
        rejectedAt: o.rejectedAt,
        rejectionReason: o.rejectionReason || null,
        consumer: o.consumerId
          ? {
              name: o.consumerId.name,
              mobile: o.consumerId.mobile,
              isFavorite: dp.favoriteConsumers.includes(o.consumerId._id),
            }
          : null,
        address: o.addressId
          ? {
              line: o.addressId.addressLine,
              label: o.addressId.addressName,
              type: o.addressId.addressType,
              lat: o.addressId.lat || null,
              long: o.addressId.long || null,
              geolocation: o.addressId.geolocation || null,
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
        store: {
          name: store.store_name || null,
          address: store.store_address || null,
          lat: store.lat || null,
          long: store.long || null,
          geolocation: store.geolocation || null,
        },
      };
    };

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

    const dp = await DeliveryPerson.findById(dpId).lean();
    const favoriteIds = dp?.favoriteConsumers?.map((id) => String(id)) || [];

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
      .populate(
        "addressId",
        "addressLine addressName addressType lat long geolocation"
      )
      .populate("items.productId", "name")
      .populate("storeId", "store_name store_address lat long geolocation")
      .sort({ deliveredAt: -1, rejectedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // count for pagination
    const totalOrders = await Order.countDocuments(filter);

    // cleaner data structure
    const cleanData = orders.map((order) => ({
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryCharge: order.deliveryCharge,
      fastDelivery: order.fastDelivery,
      assignedAt: order.updatedAt || null,
      slot: {
        date: order.slotDate,
        start: order.slotStart,
        end: order.slotEnd,
      },
      consumer: order.consumerId
        ? {
            name: order.consumerId.name,
            mobile: order.consumerId.mobile,
            isFavorite: favoriteIds.includes(String(order.consumerId._id)),
          }
        : null,
      address: order.addressId
        ? {
            line: order.addressId.addressLine,
            label: order.addressId.addressName,
            type: order.addressId.addressType,
            lat: order.addressId.lat || null,
            long: order.addressId.long || null,
            geolocation: order.addressId.geolocation || null,
          }
        : null,
      store: order.storeId
        ? {
            name: order.storeId.store_name,
            address: order.storeId.store_address,
            lat: order.storeId.lat || null,
            long: order.storeId.long || null,
            geolocation: order.storeId.geolocation || null,
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
    if (!dp)
      return res.status(404).json({ message: "Delivery person not found" });
    const allDeliveredOrders = await Order.find(
      {
        deliveryPersonId: dpId,
        orderStatus: "DELIVERED",
        deliveredAt: { $exists: true, $ne: null },
      },
      "deliveredAt deliveryCharge deliveryRating"
    ).lean();

    const rejectedOrders = await Order.find(
      {
        deliveryPersonId: dpId,
        orderStatus: "REJECTED_BY_DP",
        rejectedAt: { $exists: true, $ne: null },
      },
      "rejectedAt"
    ).lean();

    const today = dayjs();
    const startOfWeek = today.startOf("isoWeek");
    const endOfWeek = today.endOf("isoWeek");
    const startOfMonth = today.startOf("month");
    const endOfMonth = today.endOf("month");

    // Helper to sum actual deliveryCharge
    const sumEarnings = (orders) =>
      orders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

    const isDeliveredToday = (o) =>
      o.deliveredAt && dayjs(o.deliveredAt).isSame(today, "day");

    const isDeliveredThisWeek = (o) =>
      o.deliveredAt &&
      dayjs(o.deliveredAt).isBetween(startOfWeek, endOfWeek, "day", "[]");

    const isDeliveredThisMonth = (o) =>
      o.deliveredAt &&
      dayjs(o.deliveredAt).isBetween(startOfMonth, endOfMonth, "day", "[]");

    // Filter orders
    const todayDelivered = allDeliveredOrders.filter(isDeliveredToday);
    const weekDelivered = allDeliveredOrders.filter(isDeliveredThisWeek);
    const monthDelivered = allDeliveredOrders.filter(isDeliveredThisMonth);

    // Count
    const todayDeliveries = todayDelivered.length;
    const weekDeliveries = weekDelivered.length;
    const monthDeliveries = monthDelivered.length;
    const totalDeliveries = allDeliveredOrders.length;

    // Earnings
    const todayEarnings = sumEarnings(todayDelivered);
    const weekEarnings = sumEarnings(weekDelivered);
    const monthEarnings = sumEarnings(monthDelivered);
    const totalEarnings = sumEarnings(allDeliveredOrders);

    // Rejection counts
    const todayRejections = rejectedOrders.filter((o) =>
      dayjs(o.rejectedAt).isSame(today, "day")
    ).length;
    const weekRejections = rejectedOrders.filter((o) =>
      dayjs(o.rejectedAt).isBetween(startOfWeek, endOfWeek, "day", "[]")
    ).length;
    const monthRejections = rejectedOrders.filter((o) =>
      dayjs(o.rejectedAt).isBetween(startOfMonth, endOfMonth, "day", "[]")
    ).length;
    const totalRejections = rejectedOrders.length;

    // Ratings
    const ratedOrders = allDeliveredOrders.filter((o) => o.deliveryRating);
    const todayRatings = todayDelivered.filter((o) => o.deliveryRating).length;
    const weekRatings = weekDelivered.filter((o) => o.deliveryRating).length;
    const monthRatings = monthDelivered.filter((o) => o.deliveryRating).length;
    const totalRatings = ratedOrders.length;

    // Weekly breakdown with deliveryCharge earnings
    const weekBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const day = startOfWeek.add(i, "day");
      const dayOrders = allDeliveredOrders.filter((o) =>
        dayjs(o.deliveredAt).isSame(day, "day")
      );

      weekBreakdown.push({
        day: day.format("ddd"),
        date: day.format("YYYY-MM-DD"),
        deliveries: dayOrders.length,
        earnings: sumEarnings(dayOrders),
      });
    }

    // Monthly breakdown
    const monthBreakdown = [];
    let cursor = startOfMonth.clone();
    let weekIndex = 1;

    while (cursor.isBefore(endOfMonth) || cursor.isSame(endOfMonth, "day")) {
      const weekStart = cursor.clone();
      let weekEnd = weekStart.clone().add(6, "day");
      if (weekEnd.isAfter(endOfMonth)) weekEnd = endOfMonth.clone();

      const weekOrders = allDeliveredOrders.filter((o) =>
        dayjs(o.deliveredAt).isBetween(weekStart, weekEnd, "day", "[]")
      );

      monthBreakdown.push({
        week: `Week ${weekIndex}`,
        start: weekStart.format("YYYY-MM-DD"),
        end: weekEnd.format("YYYY-MM-DD"),
        deliveries: weekOrders.length,
        earnings: sumEarnings(weekOrders),
      });

      cursor = weekEnd.clone().add(1, "day");
      weekIndex++;
    }

    // Response
    res.json({
      today: {
        deliveries: todayDeliveries,
        earnings: todayEarnings,
        rejections: todayRejections,
        ratings: todayRatings,
      },
      week: {
        deliveries: weekDeliveries,
        earnings: weekEarnings,
        rejections: weekRejections,
        ratings: weekRatings,
        breakdown: weekBreakdown,
      },
      month: {
        deliveries: monthDeliveries,
        earnings: monthEarnings,
        rejections: monthRejections,
        ratings: monthRatings,
        breakdown: monthBreakdown,
      },
      total: {
        deliveries: totalDeliveries,
        earnings: totalEarnings,
        rejections: totalRejections,
        averageRating: dp.averageRating || 0,
        ratingCount: totalRatings,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error calculating metrics", error: err.message });
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

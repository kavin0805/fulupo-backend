import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import Order from "../../modules/consumer/Order.js";
import dayjs from "dayjs";
import pushDeliveryNotification from "../../utils/deliveryNotificationHelper.js"

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
    const { orderId, action } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId))
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });

    const today = dayjs().format("YYYY-MM-DD");
    const dp = await DeliveryPerson.findById(dpId);

    // reset daily rejection counter
    if (dp.rejectionCountDate !== today) {
      dp.rejectionCountDate = today;
      dp.rejectionCount = 0;
    }

    if (action === "REJECT") {
      if (dp.rejectionCount >= dp.rejectionLimitPerDay) {
        return res
          .status(403)
          .json({ message: "Daily rejection limit reached" });
      }
      dp.rejectionCount += 1;
      await dp.save();
      order.orderStatus = "REJECTED_BY_DP";
      await order.save();


      // order rejected notification
      await pushDeliveryNotification({
        deliveryPersonId: dpId,
        storeId: order.storeId,
        orderId: order._id,
        type: "StatusRejected",
        title: "Delivery Rejected",
        message: `Order #${order.orderNumber?.slice(-4) || order._id.toString().slice(-4)} rejected. You've used ${dp.rejectionCount}/${dp.rejectionLimitPerDay} rejections today.`,
      });

      return res.json({ message: "Order rejected successfully" });
    }

    // change order status when DP Accepts the delivery
    order.orderStatus = "OUT_FOR_DELIVERY";
    await order.save();

    res.json({ message: "Order accepted", order });
  } catch (err) {
    res.status(500).json({ message: "DP response error", error: err.message });
  }
};

// delivery completion
export const completeDelivery = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { orderId, pin } = req.body;

    const order = await Order.findById(orderId);
    if (!order || String(order.deliveryPersonId) !== String(dpId))
      return res
        .status(404)
        .json({ message: "Order not assigned to this delivery person" });

    if (order.deliveryPin !== pin)
      return res.status(400).json({ message: "Invalid PIN" });

    order.orderStatus = "DELIVERED";
    await order.save();

    // Delivery completed notification
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

    res.json({ message: "Delivery completed" });
  } catch (err) {
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

    const todayOrders = await Order.find({
      deliveryPersonId: dpId,
      slotDate: today,
    });

    const toBeDelivered = todayOrders.filter(
      (o) => o.orderStatus === "OUT_FOR_DELIVERY"
    );
    const delivered = todayOrders.filter((o) => o.orderStatus === "DELIVERED");

    res.json({
      date: today,
      totalOrders: todayOrders.length,
      toBeDelivered: toBeDelivered.length,
      delivered: delivered.length,
      deliveredOrders: delivered,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching today's overview", error: err.message });
  }
};

// Get order history with filters (date + status)
export const getOrderHistory = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const { startDate, endDate, status } = req.query;

    const filter = { deliveryPersonId: dpId };

    if (startDate && endDate) {
      filter.slotDate = { $gte: startDate, $lte: endDate };
    }
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter).sort({ slotDate: -1 });
    res.json({ count: orders.length, data: orders });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching order history", error: err.message });
  }
};

// Get delivery performance metrics (daily, weekly, monthly, total)
export const getDeliveryMetrics = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;
    const dp = await DeliveryPerson.findById(dpId);
    if (!dp)
      return res.status(404).json({ message: "Delivery person not found" });

    const allDeliveredOrders = await Order.find({
      deliveryPersonId: dpId,
      orderStatus: "DELIVERED",
    });

    const today = dayjs().format("YYYY-MM-DD");
    const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");

    const calcCount = (filterFn) => allDeliveredOrders.filter(filterFn).length;

    const todayDeliveries = calcCount((o) => o.slotDate === today);
    const weekDeliveries = calcCount((o) => o.slotDate >= startOfWeek);
    const monthDeliveries = calcCount((o) => o.slotDate >= startOfMonth);

    const perDeliveryEarning = dp.earningsPerDelivery || 0;

    res.json({
      today: {
        deliveries: todayDeliveries,
        earnings: todayDeliveries * perDeliveryEarning,
      },
      week: {
        deliveries: weekDeliveries,
        earnings: weekDeliveries * perDeliveryEarning,
      },
      month: {
        deliveries: monthDeliveries,
        earnings: monthDeliveries * perDeliveryEarning,
      },
      total: {
        deliveries: allDeliveredOrders.length,
        earnings: allDeliveredOrders.length * perDeliveryEarning,
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

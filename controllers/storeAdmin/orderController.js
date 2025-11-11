import Order from "../../modules/consumer/Order.js";
import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";

// store admin approves the order when customer places one
export const approveOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Already approved check
    if (order.orderStatus !== "PENDING_STORE_APPROVAL") {
      return res.status(400).json({
        message: `Order already processed`,
        currentStatus: order.orderStatus
      });
    }

    // Approve order
    order.orderStatus = "WAITING_FOR_DP_ASSIGNMENT";
    await order.save();

    res.json({ message: "Order approved successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Approval error", error: err.message });
  }
};


// assign delivery partners for delivering the order
export const assignDeliveryPerson = async (req, res) => {
  try {
    const { orderId, deliveryPersonId } = req.body;

    const dp = await DeliveryPerson.findById(deliveryPersonId);
    if (!dp)
      return res.status(404).json({ message: "Delivery person not found" });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Prevent assigning if already assigned
    if (order.deliveryPersonId) {
      return res.status(400).json({
        message: "Order is already assigned to a delivery person",
        assignedTo: order.deliveryPersonId
      });
    }

    // strict status check 
    if (order.orderStatus !== "WAITING_FOR_DP_ASSIGNMENT") {
      return res.status(400).json({
        message: `Cannot assign DP in current status`,
        currentStatus: order.orderStatus
      });
    }

    // Assign DP
    order.deliveryPersonId = deliveryPersonId;
    order.orderStatus = "ASSIGNED_TO_DP";
    await order.save();

    res.json({ message: "Delivery person assigned successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Assign error", error: err.message });
  }
};



// Reassign order to a new DP when previous DP rejected
export const reassignDeliveryPerson = async (req, res) => {
  try {
    const storeId = req.store._id;
    const { orderId, deliveryPersonId } = req.body;

    if (!orderId || !deliveryPersonId) {
      return res.status(400).json({ message: "orderId and deliveryPersonId are required" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (String(order.storeId) !== String(storeId)) {
      return res.status(403).json({ message: "Order does not belong to your store" });
    }

    // Only allow reassign when rejected or waiting for assignment
    if (!["REJECTED_BY_DP", "WAITING_FOR_DP_ASSIGNMENT"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: "Order cannot be reassigned in the current status",
        currentStatus: order.orderStatus
      });
    }

    // Prevent assigning same DP again
    if (order.deliveryPersonId && String(order.deliveryPersonId) === String(deliveryPersonId)) {
      return res.status(400).json({
        message: "This delivery person is already assigned to this order"
      });
    }

    const dp = await DeliveryPerson.findById(deliveryPersonId);
    if (!dp) return res.status(404).json({ message: "Delivery person not found" });

    // Check DP belongs to the same store
    if (String(dp.storeId) !== String(storeId)) {
      return res.status(400).json({ message: "Delivery person does not belong to your store" });
    }

    // Assign new DP
    order.deliveryPersonId = deliveryPersonId;
    order.orderStatus = "ASSIGNED_TO_DP";
    await order.save();

    res.json({ message: "Order reassigned successfully", order });
  } catch (err) {
    res.status(500).json({ message: "Reassign error", error: err.message });
  }
};



// Store admin order list with status filter + pagination
export const getStoreOrders = async (req, res) => {
  try {
    const storeId = req.store._id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { storeId };
    if (status) query.orderStatus = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("consumerId", "name mobile")
        .populate("addressId")
        .populate("deliveryPersonId", "name mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
};

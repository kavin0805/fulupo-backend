import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import Order from "../../modules/consumer/Order.js";
import dayjs from "dayjs";

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
      return res.status(404).json({ message: "Order not assigned to this delivery person" });

    const today = dayjs().format("YYYY-MM-DD");
    const dp = await DeliveryPerson.findById(dpId);

    // reset daily rejection counter
    if (dp.rejectionCountDate !== today) {
      dp.rejectionCountDate = today;
      dp.rejectionCount = 0;
    }

    if (action === "REJECT") {
      if (dp.rejectionCount >= dp.rejectionLimitPerDay) {
        return res.status(403).json({ message: "Daily rejection limit reached" });
      }
      dp.rejectionCount += 1;
      await dp.save();
      order.orderStatus = "REJECTED_BY_DP";
      await order.save();
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
      return res.status(404).json({ message: "Order not assigned to this delivery person" });

    if (order.deliveryPin !== pin)
      return res.status(400).json({ message: "Invalid PIN" });

    order.orderStatus = "DELIVERED";
    await order.save();

    res.json({ message: "Delivery completed" });
  } catch (err) {
    res.status(500).json({ message: "Delivery complete error", error: err.message });
  }
};
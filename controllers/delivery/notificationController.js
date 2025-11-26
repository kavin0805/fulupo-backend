import DeliveryNotification from "../../modules/delivery/deliveryNotification.js";

// get unread count
export const getDPNotificationBadge = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;

    const unreadCount = await DeliveryNotification.countDocuments({
      deliveryPersonId: dpId,
      isRead: false
    });

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ message: "Badge fetch error", error: err.message });
  }
};


// get all unread notifications
export const getUnreadNotifications = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;

    const notifications = await DeliveryNotification.find({
      deliveryPersonId: dpId,
      isRead: false
    }).sort({ createdAt: -1 });

    res.json({ count: notifications.length, notifications });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching unread notifications",
      error: err.message
    });
  }
};

// mark all notifications as read
export const markAllNotificationsRead = async (req, res) => {
  try {
    const dpId = req.deliveryPerson._id;

    const result = await DeliveryNotification.updateMany(
      { deliveryPersonId: dpId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    const unreadCount = await DeliveryNotification.countDocuments({
      deliveryPersonId: dpId,
      isRead: false
    });

    res.json({
      message: "Marked all as read",
      updated: result.modifiedCount,
      unreadCount
    });

  } catch (err) {
    res.status(500).json({
      message: "Error updating notifications",
      error: err.message
    });
  }
};


// mark single notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const dpId = req.deliveryPerson._id;

    const notif = await DeliveryNotification.findOneAndUpdate(
      { _id: id, deliveryPersonId: dpId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // return updated badge count
    const unreadCount = await DeliveryNotification.countDocuments({
      deliveryPersonId: dpId,
      isRead: false
    });

    res.json({ 
      message: "Marked as read", 
      notification: notif,
      unreadCount
    });

  } catch (err) {
    res.status(500).json({
      message: "Error marking read",
      error: err.message
    });
  }
};


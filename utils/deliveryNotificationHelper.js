import DeliveryNotification from "../modules/delivery/deliveryNotification.js";

/**
 * Pushes a delivery notification to DB + emits via Socket.IO if connected.
 * @param {Object} data
 * @param {string} data.deliveryPersonId - The ID of the delivery person
 * @param {string} data.storeId - Store ID related to the notification
 * @param {string} data.orderId - Order ID related to the notification
 * @param {string} data.type - Type of notification ("StatusDelivered", "StatusRejected", etc.)
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {number} [data.expiresInHours=72] - Expiry duration in hours
 */
const pushDeliveryNotification = async ({
  deliveryPersonId,
  storeId,
  orderId,
  type,
  title,
  message,
  expiresInHours = 72,
}) => {
  try {
    if (!deliveryPersonId || !type || !title || !message) {
      console.warn("Missing required notification data");
      return;
    }

    // Expiration logic (default 3 days)
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    // Save notification to DB
    const notification = await DeliveryNotification.create({
      deliveryPersonId,
      storeId,
      orderId,
      type,
      title,
      message,
      expiresAt,
    });

    // Emit to delivery person’s socket room (real-time)
    if (global.io) {
      const roomId = `dp_${deliveryPersonId}`;
      const room = global.io.sockets.adapter.rooms.get(roomId);

      if (room && room.size > 0) {
        // Active connection found → push immediately
        global.io.to(roomId).emit("notification", notification);
        console.log(`Sent live notification to ${roomId}`);
      } else {
        console.log(`Delivery person ${deliveryPersonId} offline — saved to DB`);
      }
    }

    return notification;
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

export default pushDeliveryNotification;

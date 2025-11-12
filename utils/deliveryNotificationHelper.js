import DeliveryNotification from "../modules/delivery/deliveryNotification.js";

// Simple helper to create a notification
export const pushDeliveryNotification = async ({
  deliveryPersonId,
  storeId,
  orderId,
  type,
  title,
  message,
  expiresInHours = 72,
}) => {
  try {
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const notification = await DeliveryNotification.create({
      deliveryPersonId,
      storeId,
      orderId,
      type,
      title,
      message,
      expiresAt,
    });

    // socket integration
    if (global.io && deliveryPersonId) {
      global.io.to(`dp_${deliveryPersonId}`).emit("notification", notification);
    }

    return notification;
  } catch (err) {
    console.error("Notification Error:", err.message);
  }
};

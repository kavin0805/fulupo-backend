import express from "express";
import {
  getDPNotificationBadge,
  getUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../controllers/delivery/notificationController.js";

import { verifyDeliveryPerson } from "../../middleware/deliveryPersonAuth.js";

const router = express.Router();

// GET unread count
router.get("/notifications/badge", verifyDeliveryPerson, getDPNotificationBadge);

// GET all unread notifications
router.get("/notifications/unread",verifyDeliveryPerson, getUnreadNotifications);

// Mark ALL as read
router.put("/notifications/mark-all-read", verifyDeliveryPerson, markAllNotificationsRead);

// Mark ONE as read
router.put("/notifications/mark-read/:id", verifyDeliveryPerson,  markNotificationRead);

export default router;
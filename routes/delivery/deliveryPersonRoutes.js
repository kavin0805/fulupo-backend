import express from "express";
import {
  loginDeliveryPerson,
  verifyDeliveryOtp,
  logoutDeliveryPerson,
} from "../../controllers/delivery/authController.js";
import {
  getMyProfile,
  updateMyProfile,
  completeDelivery,
  getOrderDetails,
  toggleFavoriteCustomer,
  pickUpOrder,
  startDelivery,
  respondToOrder,
  getTodayOverview,
  getOrderHistory,
  getDeliveryMetrics
  
} from "../../controllers/delivery/deliveryPersonController.js";
import { upload } from "../../middleware/upload.js";
import { verifyDeliveryPerson } from "../../middleware/deliveryPersonAuth.js";

const router = express.Router();

// login delivery person with OTP
router.post("/login", loginDeliveryPerson);
// verify OTP for delivery person
router.post("/verify-otp", verifyDeliveryOtp);
// logout delivery person
router.post("/logout", logoutDeliveryPerson);
// get my profile
router.get("/profile", verifyDeliveryPerson, getMyProfile);
// update my profile
router.put(
  "/update",
  verifyDeliveryPerson,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "vehiclePhoto", maxCount: 1 },
    { name: "rcImage", maxCount: 1 },
    { name: "insuranceImage", maxCount: 1 },
    { name: "aadharImage", maxCount: 1 },
    { name: "drivingLicenseImage", maxCount: 1 },
    { name: "passbookImage", maxCount: 1 },
  ]),
  updateMyProfile
);

router.get("/order-details", verifyDeliveryPerson, getOrderDetails);
router.post("/favorite",verifyDeliveryPerson, toggleFavoriteCustomer)
router.post("/respond", verifyDeliveryPerson, respondToOrder);
router.post("/complete-delivery", verifyDeliveryPerson, completeDelivery);
router.post("/pick-up", verifyDeliveryPerson, pickUpOrder);
router.post("/start-delivery", verifyDeliveryPerson, startDelivery);
router.get("/overview/today", verifyDeliveryPerson, getTodayOverview);
router.get("/history", verifyDeliveryPerson, getOrderHistory);
router.get("/metrics", verifyDeliveryPerson, getDeliveryMetrics);


export default router;

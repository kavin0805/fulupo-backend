import express from "express";
import { consumerAuth } from "../../middleware/consumerAuth.js";
import { addAddress, deleteAddress, getAddresses, updateAddress } from "../../controllers/consumer/ConsumerAddressController.js";

const router = express.Router();

router.post("/add", consumerAuth, addAddress);
router.get("/get", consumerAuth, getAddresses);
router.put("/update/:addressId", consumerAuth, updateAddress);
router.post("/delete", consumerAuth, deleteAddress);

export default router;
 
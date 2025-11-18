import express from 'express';
import deliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";
import { createDeliveryPersonByStore, getDeliveryPersonsByStore, getDeliveryPersonByStoreAndId, deleteDeliveryPersonByStoreAndId } from "../../controllers/storeAdmin/deliveryPersonController.js";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js";

const router = express.Router();

// create new delivery person by store ID by store admin
router.post("/create", verifyStoreAdmin , createDeliveryPersonByStore);
// list delivery persons by store ID by store admin
router.get("/list", verifyStoreAdmin, getDeliveryPersonsByStore);
// get a delivery person by store ID and delivery person ID
router.get("/get-one", verifyStoreAdmin, getDeliveryPersonByStoreAndId);
//  delete a delivery person by store ID and delivery person ID
router.delete("/delete-one", verifyStoreAdmin, deleteDeliveryPersonByStoreAndId);

export default router;
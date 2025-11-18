import express from "express";
import {
  addEmployee,
  getEmployees,
  getEmployee,
  updateEmployee,
  deleteEmployee,
  searchEmployee
} from "../../controllers/storeAdmin/employeeController.js";
import { verifyStoreAdmin } from "../../middleware/authMiddeware.js"

const router = express.Router();

// All employee APIs are protected by store login
router.post("/", verifyStoreAdmin, addEmployee);
router.get("/", verifyStoreAdmin, getEmployees);
router.get("/search", verifyStoreAdmin, searchEmployee);
router.get("/:id", verifyStoreAdmin, getEmployee);
router.put("/:id", verifyStoreAdmin, updateEmployee);
router.delete("/:id", verifyStoreAdmin, deleteEmployee);

export default router;

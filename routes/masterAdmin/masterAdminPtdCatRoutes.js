import express from "express";
import {
  addMasterProductCategory,
  deleteMasterCategory,
  getAllMasterCategories,
  updateMasterCategory,
} from "../../controllers/masterAdmin/MasterProductCategory.js";
import { upload } from "../../middleware/upload.js";
import { authMasterAdmin } from "../../middleware/authMasterAdmin.js";

const router = express.Router();

router.post("/add", authMasterAdmin , upload.single('icon') , addMasterProductCategory);
router.get("/get-all", authMasterAdmin , getAllMasterCategories);
router.put("/:id", authMasterAdmin , upload.single('icon') , updateMasterCategory);  
router.delete("/:id", authMasterAdmin , deleteMasterCategory);

export default router;

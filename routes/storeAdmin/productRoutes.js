import express from "express";
import { upload } from "../../middleware/upload.js";
import {
  addProduct,
  findProducts,
  // getAllProducts,
  getAllProductsByStore,
  getAllProductsByStoreByPage,
  getAllProductsGroupedByStores,
  getProductById,
  // getProductsByCategory,
  getProductsByCategoryAndStore,
  getProductsGroupedByCategory,
  // getProductById,
  // getProductsByCategory,
  // getProductsGroupedByCategory,
  getProductsGroupedByCategoryAndStore,
  // getProductsGroupedByCategory,
  updateProduct,
} from "../../controllers/storeAdmin/productController.js";
import {auth} from "../../middleware/auth.js";
import isAdmin from "../../middleware/isAdmin.js";
import verifyOnBoardStoreAdminToken, { verifyStoreAdmin } from "../../middleware/authMiddeware.js";
import { gsmUpload } from "../../middleware/gsmUpload.js";
import { authMasterAdmin, authMasterStoreAdmin } from "../../middleware/authMasterAdmin.js";

const router = express.Router();

// Product Routes
// router.post("/add", verifyStoreAdmin , upload.single("productImage"), addProduct);
// router.put("/update/:id", verifyStoreAdmin , upload.single("productImage"), updateProduct);
// router.get("/list", auth ,  getAllProducts);
// // router.get("/list/group-by-category", getProductsGroupedByCategory);
// router.get("/list/:id", auth ,  getProductById);
// // router.get("/list/category/:categoryId", getProductsByCategory);

// // router.get('/list/store/:storeId', auth , getAllProductsByStore);
// router.get('/list/:categoryId', auth , getProductsByCategory);
// router.get('/list/group-by-category/:storeId', auth , getProductsGroupedByCategory);

// Product Routes
router.post("/add", authMasterStoreAdmin , gsmUpload.array("dimenstionImages"), addProduct);
router.put("/update/:id", authMasterStoreAdmin , gsmUpload.array("dimenstionImages"), updateProduct);
// router.get("/list",  getAllProducts);
// router.get("/list/group-by-category", getProductsGroupedByCategory);
router.get('/list/grouped/ByStore' , authMasterAdmin , getAllProductsGroupedByStores);
router.post('/list/store' , authMasterAdmin , getAllProductsByStoreByPage);

router.get("/list/:id", auth ,  getProductById);
// router.get("/list/category/:categoryId", getProductsByCategory);

router.get('/list/store/:storeId' , getAllProductsByStore);
router.get('/list/:categoryId/store/:storeId', auth , getProductsByCategoryAndStore);
router.post('/list/group-by-category', auth , getProductsGroupedByCategory);



router.post('/find-products' , findProducts)

export default router;

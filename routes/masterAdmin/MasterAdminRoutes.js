// routes/masterProductRoutes.js
import express from 'express';
import { addMasterProduct, deleteMasterProduct, getAllMasterProducts, getGroupedByCategory, getMasterProductByCategory, updateMasterProduct } from '../../controllers/masterAdmin/MasterProduct.js'
import { upload } from '../../middleware/upload.js';
import {auth} from '../../middleware/auth.js';
import { authMasterAdmin } from '../../middleware/authMasterAdmin.js';
const router = express.Router();

router.post('/add', authMasterAdmin , upload.single('productImage') , addMasterProduct);
router.get('/get', authMasterAdmin ,  getAllMasterProducts);
router.get('/grouped', authMasterAdmin , getGroupedByCategory);
router.get('/category/:categoryId', authMasterAdmin , getMasterProductByCategory);
router.put('/:id', authMasterAdmin , updateMasterProduct);
router.delete('/:id', authMasterAdmin , deleteMasterProduct);

export default router;
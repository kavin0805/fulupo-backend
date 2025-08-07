import express from 'express';
import { addCategory, getCategories, getCategoryById, updateCategory } from '../../controllers/storeAdmin/productCategoryController.js';
// import auth from '../../middleware/auth.js';
import isAdmin from '../../middleware/isAdmin.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { upload } from '../../middleware/upload.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';
import { auth } from '../../middleware/auth.js';
// import authMiddleware from '../middlewares/authMiddleware.js'; // optional if you want to protect with token

const router = express.Router();

router.post('/product-categories', authMasterStoreAdmin , upload.single('icon') , addCategory);         // Add
router.put('/product-categories/:id', authMasterStoreAdmin , upload.single('icon') , updateCategory);   // Update
router.get('/product-categories',auth , getCategories);        // Get All
router.get('/product-categories/:id', auth  , getCategoryById);

export default router; 

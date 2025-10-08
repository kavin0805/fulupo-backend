import express from 'express';
import { addStoreCategory, deleteStoreCategory, getStoreCategories, updateStoreCategory } from '../../controllers/FulupoStore/storeCategoryCustomController.js';
import { upload } from '../../middleware/upload.js';
import { checkStoreVerified } from '../../middleware/checkStoreVerification.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';


const router = express.Router();

router.post('/store-categories', authMasterStoreAdmin , checkStoreVerified ,  upload.single('icon') , addStoreCategory); // Add
router.get('/store-categories', authMasterStoreAdmin , checkStoreVerified , getStoreCategories); // Get all
router.put('/store-categories/:id',  authMasterStoreAdmin , checkStoreVerified , upload.single('icon') , updateStoreCategory); // Update
router.delete('/store-categories/:id', authMasterStoreAdmin , checkStoreVerified , deleteStoreCategory); // Delete

export default router;

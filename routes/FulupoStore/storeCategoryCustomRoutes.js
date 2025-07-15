import express from 'express';
import { addStoreCategory, deleteStoreCategory, getStoreCategories, updateStoreCategory } from '../../controllers/FulupoStore/storeCategoryCustomController.js';
import { upload } from '../../middleware/upload.js';


const router = express.Router();

router.post('/store-categories',  upload.single('icon') , addStoreCategory); // Add
router.get('/store-categories', getStoreCategories); // Get all
router.put('/store-categories/:id', upload.single('icon') , updateStoreCategory); // Update
router.delete('/store-categories/:id', deleteStoreCategory); // Delete

export default router;

import express from 'express';
import { addStore, deleteStore, getAllStores, getDistrictsByState, getStates, getStoreById, getStoresByCategoryId, updateStore } from '../../controllers/onBoarding/storeController.js';
import {upload} from '../../middleware/upload.js'
import { addStoreCategory, deleteStoreCategory, getStoreCategories, updateStoreCategory } from '../../controllers/onBoarding/storeCategoryController.js';
import auth from '../../middleware/auth.js'
import { addFulupoSoft, deleteFulupoSoft, getFulupoSoft, updateFulupoSoft } from '../../controllers/onBoarding/fulupoSoftController.js';

const router = express.Router();


// Store Category Routes
router.post('/store-categories', auth , addStoreCategory);
router.put('/store-categories/:id', auth, updateStoreCategory);
router.delete('/store-categories/:id', auth, deleteStoreCategory);
router.get('/store-categories',auth, getStoreCategories);


router.get('/locations/states', getStates);
router.get('/locations/districts/:state', getDistrictsByState);

 
// FulupoSoft Routes
router.post('/fulupo-soft', auth, addFulupoSoft);
router.put('/fulupo-soft/:id', auth, updateFulupoSoft);
router.delete('/fulupo-soft/:id', auth, deleteFulupoSoft);
router.get('/fulupo-soft', auth, getFulupoSoft);


// Stores Routes
router.post('/stores',auth , upload.fields([
  { name: 'store_logo', maxCount: 1 },
  { name: 'store_image', maxCount: 9 },
  { name: 'store_licence', maxCount: 1 },
  { name: 'owner_kyc_details', maxCount: 1 }
]), addStore);
router.get('/stores',auth, getAllStores); 
router.get('/stores/:id',auth, getStoreById);
router.get('/stores/category/:categoryId',auth, getStoresByCategoryId);
router.put('/stores/:id', auth, updateStore);
router.delete('/stores/:id', auth, deleteStore);

export default router;

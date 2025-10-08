import express from 'express';
import { addStore, deleteStore, getAllStores, getDistrictsByState, getStates, getStoreById, getStoreList, getStoresByCategoryId, updateStore } from '../../controllers/onBoarding/storeController.js';
import {upload} from '../../middleware/upload.js'
import { addStoreCategory, deleteStoreCategory, getStoreCategories, updateStoreCategory } from '../../controllers/onBoarding/storeCategoryController.js';
// import auth from '../../middleware/auth.js'
import { addFulupoSoft, deleteFulupoSoft, getFulupoSoft, updateFulupoSoft } from '../../controllers/onBoarding/fulupoSoftController.js';
import {auth, onBoardauth} from '../../middleware/auth.js';

const router = express.Router();


// Store Category Routes
router.post('/store-categories', onBoardauth , addStoreCategory);
router.put('/store-categories/:id', onBoardauth, updateStoreCategory);
router.delete('/store-categories/:id', onBoardauth, deleteStoreCategory);
router.get('/store-categories',onBoardauth, getStoreCategories);


router.get('/locations/states', getStates);
router.get('/locations/districts/:state', getDistrictsByState);

 
// FulupoSoft Routes
router.post('/fulupo-soft', onBoardauth, addFulupoSoft);
router.put('/fulupo-soft/:id', onBoardauth, updateFulupoSoft);
router.delete('/fulupo-soft/:id', onBoardauth, deleteFulupoSoft);
router.get('/fulupo-soft', onBoardauth, getFulupoSoft);


// Stores Routes
router.post('/stores',onBoardauth , upload.fields([
  { name: 'store_logo', maxCount: 1 },
  { name: 'store_image', maxCount: 9 },
  { name: 'store_licence', maxCount: 5 },
  { name: 'owner_kyc_details', maxCount: 5 }
]), addStore);
router.get('/stores',auth , getAllStores);
router.get('/getStores' , auth , getStoreList); 
router.get('/stores/:id',onBoardauth, getStoreById);
router.get('/stores/category/:categoryId',onBoardauth, getStoresByCategoryId);
router.put('/stores/:id', auth , upload.fields([
  { name: 'store_logo', maxCount: 1 },
  { name: 'store_image', maxCount: 9 },
  { name: 'store_licence', maxCount: 5 },
  { name: 'owner_kyc_details', maxCount: 5 }
]), updateStore);
router.delete('/stores/:id', auth , deleteStore);

export default router;

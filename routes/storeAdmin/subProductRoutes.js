import express from 'express';
import { addSubProduct, getSubProductsByStoreId, meatPad, updateSubProduct } from '../../controllers/storeAdmin/subProductController.js';
import {auth} from '../../middleware/auth.js';
import isAdmin from '../../middleware/isAdmin.js';
import { upload } from '../../middleware/upload.js';
import { verifyStoreAdmin } from '../../middleware/authMiddeware.js';
import { authMasterStoreAdmin } from '../../middleware/authMasterAdmin.js';

const router = express.Router();

router.post('/add', authMasterStoreAdmin , addSubProduct); // Add
router.get('/product/:productId', auth , getSubProductsByStoreId); // Get by Product
router.put('/update/:id', authMasterStoreAdmin, updateSubProduct); //  update route





// router.post('/meatPad' , parentFun)
router.post("/transcribe", upload.single("audio") , meatPad);

export default router;

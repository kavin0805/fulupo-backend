import express from 'express';
import {auth, onBoardauth} from '../../middleware/auth.js';
import { addGSMProduct, getAllGSMProducts, getGSMProductById, getGSMProductByMasterProductId, getGSMProductsByUser } from '../../controllers/onBoarding/gsmProductController.js';
import { gsmUpload } from '../../middleware/gsmUpload.js';

const router = express.Router();

router.post('/product', onBoardauth ,  gsmUpload.array('dimenstionImages') ,  addGSMProduct);
router.post('/getAll', getAllGSMProducts );
router.post('/getById', getGSMProductById );
// router.post('/get', getGSMProductByMasterProductId );
router.get('/getByUser', onBoardauth , getGSMProductsByUser );


export default router;

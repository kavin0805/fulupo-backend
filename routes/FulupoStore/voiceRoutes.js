import express from 'express';
import { upload } from '../../middleware/upload.js';
import { voiceController } from '../../controllers/FulupoStore/voiceController.js';


const router = express.Router();

// Routes
router.post('/voiceCollection', upload.single('audio') , voiceController);


export default router;
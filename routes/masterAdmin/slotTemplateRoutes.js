import express from 'express';
import { authMasterAdmin } from '../../middleware/authMasterAdmin.js';
import { getActiveTemplate, upsertTemplate } from '../../controllers/masterAdmin/slotTemplateController.js';

const router = express.Router();

router.get('/slot-templates', authMasterAdmin, getActiveTemplate)
router.post('/slot-template',authMasterAdmin, upsertTemplate)

export default router;
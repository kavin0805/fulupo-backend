import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    const productName = req.body.name?.toLowerCase().replace(/\s+/g, '_') || 'default';
    const folder = `uploads/gsm/${productName}`;
    fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = file.originalname.replace(ext, '').replace(/\s+/g, '_');
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

export const gsmUpload = multer({ storage });
 

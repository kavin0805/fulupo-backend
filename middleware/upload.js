import multer from "multer";
import path from "path";
import fs from "fs";
// import Category from "../modules/Category.js";

// Define destination dynamically
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      let folderName = "general"; // default folder

      // if (req.body.bulk_group_name) {
      //   folderName = req.body.bulk_group_name;
      // } else if (req.body.name) {
      //   folderName = req.body.name;
      // } else 
      // if (req.body.category) {
      //   // Fetch category name from DB
      //   const categoryDoc = await Category.findById(req.body.category);
      //   if (categoryDoc && categoryDoc.name) {
      //     folderName = categoryDoc.name;
      //   }
      // }
      // else{
      //   folderName = "general";
      // }

      const uploadPath = `uploads/${folderName.replace(/\s+/g, '_')}`;

      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);

    } catch (error) {
      console.error("Error in upload destination:", error);
      cb(error, null);
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

export const upload = multer({ storage });;

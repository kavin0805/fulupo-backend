import multer from "multer";
import path from "path";
import fs from "fs";
import masterProductCategory from "../modules/masterAdmin/masterProductCategory.js";
import Store from "../modules/onBoarding/Store.js";
// import Category from "../modules/Category.js";

// Define destination dynamically
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      let folderPath = "uploads/general"; // default

      if (req.body.categoryId) {
        // ✅ Fetch category name from DB
        const categoryDoc = await masterProductCategory.findById(req.body.categoryId);
        
        if (categoryDoc && categoryDoc.name) {
          folderPath = `uploads/general/${categoryDoc.name.replace(/\s+/g, "_")}`;
        }
      }
      
       if (req.body.store_name) {
        // sanitize store name (replace spaces with underscores)
        const storeName = req.body.store_name.replace(/\s+/g, "_");
        folderPath = `uploads/store/${storeName}`;
      }

       if (req.body.purchaseBillNo) {
        const storeDoc = await Store.findById(req.body.storeId).select("store_name");
        if (storeDoc && storeDoc.store_name) {
          // Replace spaces with underscore to make safe folder name
          const safeStoreName = storeDoc.store_name.replace(/\s+/g, "_");
          folderPath = `uploads/purchasebill/${safeStoreName}`;
        }
      }

      fs.mkdirSync(folderPath, { recursive: true });
      cb(null, folderPath);

    } catch (error) {
      console.error("Error in upload destination:", error);
      cb(error, null);
    }
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

export const upload = multer({ storage });;

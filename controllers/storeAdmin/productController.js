import Inventory from "../../modules/FulupoStore/Inventory.js";
import MasterProducts from "../../modules/masterAdmin/MasterProducts.js";
import Product from "../../modules/storeAdmin/Product.js";
import ProductCategory from "../../modules/storeAdmin/ProductCategory.js";
import SubProduct from "../../modules/storeAdmin/SubProduct.js";

// Add Product
// export const addProduct = async (req, res) => {
//   try {
//     const { name, storeId, categoryId, purchasePrice , mrpPrice, discountPrice, netQty } = req.body;
//     const productImage = req.file?.path || null;

//     if (!name || name.length < 2) {
//       return res.status(400).json({ message: 'Product name is too short to generate code' });
//     }

//     // 🔁 Check if product with same name and netQty already exists for the same store and category
//     const duplicate = await Product.findOne({ name, storeId, categoryId });
//     if (duplicate) {
//       return res.status(400).json({ message: 'Product with same name already exists' });
//     }

//     // 🔠 Generate prefix from first 2 letters of name
//     const prefix = name.substring(0, 2).toUpperCase();

//     // 🔢 Find last product with same prefix and generate next code
//     const regex = new RegExp(`^${prefix}\\d{3}$`);
//     const lastProduct = await Product.find({ productCode: { $regex: regex } })
//       .sort({ productCode: -1 })
//       .limit(1);

//     let nextNumber = 1;
//     if (lastProduct.length > 0) {
//       const lastCode = lastProduct[0].productCode;
//       const lastNum = parseInt(lastCode.slice(2), 10);
//       nextNumber = lastNum + 1;
//     }

//     const productCode = `${prefix}${String(nextNumber).padStart(3, '0')}`;

//     // ✅ Create new product
//     const product = new Product({
//       name,
//       storeId,
//       categoryId,
//       productImage,
//       productCode,
//       purchasePrice,
//       mrpPrice,
//       discountPrice,
//       netQty
//     });

//     await product.save();
//     res.status(201).json(product);
//   } catch (err) {
//     res.status(500).json({ message: 'Error adding product', error: err.message });
//   }
// };

// export const addProduct = async (req, res) => {
//   try {
//     const { storeId, masterProductId, mrpPrice, discountPrice, purchasePrice, showAvlQty } = req.body;

//     if (!storeId || !masterProductId || !mrpPrice || !purchasePrice || !showAvlQty) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const master = await MasterProducts.findById(masterProductId);
//     if (!master) {
//       return res.status(404).json({ message: "Master product not found" });
//     }

//     const storeProduct = new Product({
//       storeId,
//       masterProductId,
//       mrpPrice,
//       discountPrice,
//       purchasePrice,
//       showAvlQty
//     });

//     await storeProduct.save();
//     res.status(201).json({ message: "Store product created successfully", data: storeProduct });

//   } catch (err) {
//     res.status(500).json({ message: "Error creating store product", error: err.message });
//   }
// };

export const addProduct = async (req, res) => {
  try {
    const {
      storeId,
      masterProductId,
      name,
      productCode,
      mrpPrice,
      discountPrice,
      purchasePrice,
      netQty,
      showAvlQty,
      height,
      width,
      length
    } = req.body;

    if (!storeId || !masterProductId || !mrpPrice || !purchasePrice) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 🔍 Check if this masterProduct is already used in this store
    const duplicate = await Product.findOne({ storeId, masterProductId });
    if (duplicate) {
      return res.status(400).json({ message: "This master product already exists in this store" });
    }

    const dimensionImages = req.files?.map(file => file.path) || [];

    const master = await MasterProducts.findById(masterProductId);
    if (!master) {
      return res.status(404).json({ message: "Master product not found" });
    }

    // ✅ Create store product
    const storeProduct = new Product({
      storeId,
      masterProductId,
      name,
      productCode,
      mrpPrice,
      discountPrice,
      purchasePrice,
      netQty,
      showAvlQty,
      dimensionImages,
      height,
      width,
      length
    });
    await storeProduct.save();

    // ✅ Create or update Inventory
    let inventory = await Inventory.findOne({ storeId, product_id: storeProduct._id });
    const qty = Number(showAvlQty);
    const percentage = 100;

    if (inventory) {
      inventory.quantity += qty;
      inventory.totalQty += qty;
      inventory.percentage = percentage;
      await inventory.save();
    } else {
      inventory = new Inventory({
        storeId,
        product_id: storeProduct._id,
        product_img: master.productImage,
        product_name: master.name,
        totalQty: qty,
        quantity: qty,
        product_rate: purchasePrice,
        product_gst_percent: 0,
        product_amount: purchasePrice * qty,
        percentage
      });
      await inventory.save();
    }

    res.status(201).json({
      message: "Store product and inventory added successfully",
      data: storeProduct
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating store product", error: err.message });
  }
};




// Update Product
// export const updateProduct = async (req, res) => {
//   try {
//     const { name, storeId, categoryId, purchasePrice , mrpPrice, discountPrice, netQty } = req.body;
//     const productImage = req.file?.path;

//     // Validation
//     if (!name || !storeId || !categoryId) {
//       return res.status(400).json({ message: 'Required fields are missing' });
//     }

//     // Check for duplicate (ignore case, exclude self)
//     const duplicate = await Product.findOne({
//       _id: { $ne: req.params.id },
//       name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
//       storeId,
//       categoryId
//     });

//     if (duplicate) {
//       return res.status(400).json({ message: 'Product with same name already exists in this store and category' });
//     }

//     // Prepare update data
//     const updateData = {
//       name: name.trim(),
//       storeId,
//       categoryId,
//       purchasePrice,
//       mrpPrice,
//       discountPrice,
//       netQty
//     };

//     if (productImage) {
//       updateData.productImage = productImage;
//     }

//     // Avoid accidental overwrite of productCode
//     delete updateData.productCode;

//     // Update the product
//     const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
//       .populate('categoryId', 'name')
//       .populate('storeId', 'store_name');

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     res.json({ message: 'Product updated successfully', data: product });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Error updating product', error: err.message });
//   }
// };

export const updateProduct = async (req, res) => {
  try {
    const {
      storeId,
      masterProductId,
      purchasePrice,
      mrpPrice,
      discountPrice,
      showAvlQty
    } = req.body;

    // Validation
    if (!storeId || !masterProductId || !mrpPrice || !purchasePrice || !showAvlQty) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate master product
    const master = await MasterProducts.findById(masterProductId);
    if (!master) {
      return res.status(404).json({ message: "Master product not found" });
    }

    // Update the store product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        storeId,
        masterProductId,
        purchasePrice,
        mrpPrice,
        discountPrice,
        showAvlQty
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Store product not found" });
    }

    // ✅ Update Inventory
    let inventory = await Inventory.findOne({
      storeId,
      product_id: updatedProduct._id
    });

    const percentage = 100;

    if (inventory) {
      inventory.quantity = Number(showAvlQty);
      inventory.totalQty = Number(showAvlQty);
      inventory.product_rate = purchasePrice;
      inventory.product_amount = purchasePrice * Number(showAvlQty);
      inventory.percentage = percentage;
      await inventory.save();
    } else {
      inventory = new Inventory({
        storeId,
        product_id: updatedProduct._id,
        product_img: master.productImage,
        product_name: master.name,
        totalQty: Number(showAvlQty),
        quantity: Number(showAvlQty),
        product_rate: purchasePrice,
        product_gst_percent: 0,
        product_amount: purchasePrice * Number(showAvlQty),
        percentage
      });
      await inventory.save();
    }

    res.json({ message: "Store product updated successfully", data: updatedProduct });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
};



export const getAllProductsByStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const products = await Product.find({ storeId }).populate('masterProductId', 'name categoryId  basePrice productImage');

    const result = await Promise.all(products.map(async (product) => {
      const subProducts = await SubProduct.find({ productId: product._id });
      return {
        ...product.toObject(),
        subProductCount: subProducts.length,
        productImage:product.masterProductId.productImage,
        subProducts
      };
    }));

    res.json({data : result });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching store products', error: err.message });
  }
};


export const getProductById = async (req, res) => {
  const { id } = req.params;         // Product ID
  const { storeId } = req.query;     // Optional storeId for ownership check

  try {
    const query = storeId ? { _id: id, storeId } : { _id: id };
    const product = await Product.findOne(query).populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // const subProducts = await SubProduct.find({ productId: product._id });
    // const subProductCount = subProducts.length;

    res.json({
      ...product.toObject(),
      // subProductCount,
      // subProducts
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product', error: err.message });
  }
};


export const getProductsByCategoryAndStore = async (req, res) => {
  const { categoryId, storeId } = req.params;

  try {
    const products = await Product.find({ categoryId, storeId }).populate('categoryId', 'name');

    const result = await Promise.all(products.map(async (product) => {
      const subProducts = await SubProduct.find({ productId: product._id });
      return {
        ...product.toObject(),
        subProductCount: subProducts.length,
        subProducts
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products by category and store', error: err.message });
  }
};


export const getProductsGroupedByCategoryAndStore = async (req, res) => {
  const { storeId } = req.params;

  try {
    const categories = await ProductCategory.find({ storeId });

    const result = await Promise.all(categories.map(async (category) => {
      const products = await Product.find({ categoryId: category._id, storeId }).populate('categoryId', 'name');

      const enrichedProducts = await Promise.all(products.map(async (product) => {
        const subProducts = await SubProduct.find({ productId: product._id });
        return {
          ...product.toObject(),
          subProductCount: subProducts.length,
          subProducts
        };
      }));

      return {
        _id: category._id,
        categoryName: category.name,
        products: enrichedProducts
      };
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Error grouping products by category and store', error: err.message });
  }
};



// // Get All Products  
// export const getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find().populate('categoryId', 'name');
//      const result = await Promise.all(products.map(async (product) => {
//       const subProducts = await SubProduct.find({ productId: product._id });
//       const subProductCount = await SubProduct.countDocuments({ productId: product._id });
//       return {
//         ...product.toObject(),
//         subProductCount,
//         subProducts
//       };
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching products', error: err.message });
//   }
// };

// // Get Product by ID
// export const getProductById = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id).populate('categoryId', 'name');
//     if (!product) return res.status(404).json({ message: 'Product not found' });

//     const subProducts = await SubProduct.find({ productId: product._id });
//     const subProductCount = subProducts.length;

//     res.json({
//       ...product.toObject(),
//       subProductCount,
//       subProducts
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching product', error: err.message });
//   }
// };


// // Get Products by Category ID
// export const getProductsByCategory = async (req, res) => {
//   try {
//     const products = await Product.find({ categoryId: req.params.categoryId }).populate('categoryId', 'name');

//     const result = await Promise.all(products.map(async (product) => {
//       const subProducts = await SubProduct.find({ productId: product._id });
//       const subProductCount = subProducts.length;
//       return {
//         ...product.toObject(),
//         subProductCount,
//         subProducts
//       };
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ message: 'Error fetching products by category', error: err.message });
//   }
// };


// export const getProductsGroupedByCategory = async (req, res) => {
//   try {
//     const categories = await ProductCategory.find();

//     const result = await Promise.all(categories.map(async (category) => {
//       const products = await Product.find({ categoryId: category._id }).populate('categoryId', 'name');

//       const enrichedProducts = await Promise.all(products.map(async (product) => {
//         const subProducts = await SubProduct.find({ productId: product._id });
//         const subProductCount = subProducts.length;
//         return {
//           ...product.toObject(),
//           subProductCount,
//           subProducts
//         };
//       }));

//       return {
//         _id: category._id,
//         categoryName: category.name,
//         products: enrichedProducts
//       };
//     }));

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ message: 'Error grouping products by category', error: err.message });
//   }
// };


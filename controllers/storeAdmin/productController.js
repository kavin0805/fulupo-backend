import Inventory from "../../modules/FulupoStore/Inventory.js";
import masterProductCategory from "../../modules/masterAdmin/masterProductCategory.js";
import MasterProducts from "../../modules/masterAdmin/MasterProducts.js";
import Store from "../../modules/onBoarding/Store.js";
import Product from "../../modules/storeAdmin/Product.js";
import ProductCategory from "../../modules/storeAdmin/ProductCategory.js";
import SubProduct from "../../modules/storeAdmin/SubProduct.js";
import mongoose from 'mongoose'

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
      length,
      product_gst_percent // New GST field
    } = req.body;

    if (!storeId || !masterProductId || !mrpPrice || !purchasePrice) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const duplicate = await Product.findOne({ storeId, masterProductId });
    if (duplicate) {
      return res.status(400).json({ message: "This master product already exists in this store" });
    }

    const dimensionImages = req.files?.map(file => file.path) || [];

    const master = await MasterProducts.findById(masterProductId);
    if (!master) {
      return res.status(404).json({ message: "Master product not found" });
    }

    // Calculate GST price per unit
    const gstPrice = product_gst_percent 
      ? (purchasePrice * product_gst_percent) / 100
      : 0;

    // Create Store Product
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
      dimenstionImages: dimensionImages,
      height,
      width,
      length,
      product_gst_percent,
      product_gst_price: gstPrice
    });
    await storeProduct.save();

    // Create or Update Inventory
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
        product_gst_percent: product_gst_percent || 0,
        product_gst_price: gstPrice,
        product_amount: (purchasePrice + gstPrice) * qty,
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
      showAvlQty,
      product_gst_percent // ✅ New GST field
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

    // Calculate GST price per unit
    const gstPrice = product_gst_percent
      ? (purchasePrice * product_gst_percent) / 100
      : 0;

    // Update the store product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        storeId,
        masterProductId,
        purchasePrice,
        mrpPrice,
        discountPrice,
        showAvlQty,
        product_gst_percent: product_gst_percent || 0,
        product_gst_price: gstPrice
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

    const qty = Number(showAvlQty);
    const percentage = 100;

    if (inventory) {
      inventory.quantity = qty;
      inventory.totalQty = qty;
      inventory.product_rate = purchasePrice;
      inventory.product_gst_percent = product_gst_percent || 0;
      inventory.product_gst_price = gstPrice;
      inventory.product_amount = (purchasePrice + gstPrice) * qty;
      inventory.percentage = percentage;
      await inventory.save();
    } else {
      inventory = new Inventory({
        storeId,
        product_id: updatedProduct._id,
        product_img: master.productImage,
        product_name: master.name,
        totalQty: qty,
        quantity: qty,
        product_rate: purchasePrice,
        product_gst_percent: product_gst_percent || 0,
        product_gst_price: gstPrice,
        product_amount: (purchasePrice + gstPrice) * qty,
        percentage
      });
      await inventory.save();
    }

    res.json({
      message: "Store product updated successfully",
      data: updatedProduct
    });

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

export const getAllProductsByStoreByPage = async (req, res) => {
  try {
    const { storeId, page = 1, limit = 10, search = "" } = req.body; // POST body
    const skip = (page - 1) * limit;

    // Base filter
    let filter = { storeId };

    // If search is provided, first get matching MasterProduct IDs
    if (search && search.trim() !== "") {
      const matchingMasterProducts = await MasterProducts.find({
        name: { $regex: search, $options: "i" },
      }).select("_id");

      const masterProductIds = matchingMasterProducts.map((mp) => mp._id);

      filter = {
        ...filter,
        $or: [
          { masterProductId: { $in: masterProductIds } }, // match by master product name
          { customName: { $regex: search, $options: "i" } }, // if you have store custom names
        ],
      };
    }

    // Fetch products for the store with pagination + search
    const products = await Product.find(filter)
      .populate("masterProductId", "name categoryId basePrice productImage")
      .skip(skip)
      .limit(limit);

    const totalCount = await Product.countDocuments(filter);

    const result = await Promise.all(
      products.map(async (product) => {
        const subProducts = await SubProduct.find({ productId: product._id });
        return {
          ...product.toObject(),
          subProductCount: subProducts.length,
          productImage: product.masterProductId?.productImage,
          subProducts,
        };
      })
    );

    res.json({
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      count: result.length,
      data: result,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching store products",
      error: err.message,
    });
  }
};




export const getProductById = async (req, res) => {
  const { id } = req.params; // Product ID
  const { storeId } = req.query; // Optional storeId for ownership check

  try {
    // Build query without categoryId filter
    const query = storeId ? { _id: id, storeId } : { _id: id };

    const product = await Product.findOne(query)
      .populate('masterProductId', 'name categoryId basePrice productImage');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Get sub products for this product
    const subProducts = await SubProduct.find({ productId: product._id });

    const result = {
      ...product.toObject(),
      subProductCount: subProducts.length,
      productImage: product.masterProductId?.productImage || null,
      subProducts
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({
      message: 'Error fetching product',
      error: err.message
    });
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
      const products = await Product.find({ categoryId: category._id, storeId }).populate('categoryId', 'name icon');

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

export const getProductsGroupedByCategory = async (req, res) => {
  try {
    const { storeId } = req.body;

    const categories = await masterProductCategory.aggregate([
      {
        $lookup: {
          from: "masterproducts", // join category → master products
          localField: "_id",
          foreignField: "categoryId",
          as: "masterProducts"
        }
      },
      {
        $lookup: {
          from: "products", // join products → master products
          let: { masters: "$masterProducts" }, // we need whole objects, not just ids
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$storeId", new mongoose.Types.ObjectId(storeId)] },
                    { $in: ["$masterProductId", "$$masters._id"] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "masterproducts", // join back to get productImage
                localField: "masterProductId",
                foreignField: "_id",
                as: "masterDetails"
              }
            },
            { $unwind: "$masterDetails" },
            {
              $project: {
                _id: 1,
                name: 1,
                productCode: 1,
                mrpPrice: 1,
                discountPrice: 1,
                netQty: 1,
                showAvlQty: 1,
                productImage: "$masterDetails.productImage" // 👈 add image here
              }
            }
          ],
          as: "products"
        }
      },
      {
        $project: {
          _id: 1,
          categoryName: "$name",
          categoryIcon: "$icon",
          products: 1
        }
      },
      { $sort: { categoryName: 1 , categoryIcon: 1} }
    ]);

    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ message: "Error fetching grouped products", error: err.message });
  }
};



export const getAllProductsGroupedByStores = async (req, res) => {
  try {
    // fetch all stores
    const stores = await Store.find().select("store_name");

    const result = await Promise.all(
      stores.map(async (store) => {
        const products = await Product.find({ storeId: store._id })
          .populate("masterProductId", "name categoryId basePrice productImage");

        const formattedProducts = await Promise.all(
          products.map(async (product) => {
            const subProducts = await SubProduct.find({ productId: product._id });
            return {
              ...product.toObject(),
              subProductCount: subProducts.length,
              productImage: product.masterProductId?.productImage || null,
              subProducts,
            };
          })
        );

        return {
          storeId: store._id,
          storeName: store.store_name,
          products: formattedProducts,
        };
      })
    );

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching products grouped by stores",
      error: err.message,
    });
  }
};


export const findProducts = async (req, res) => {
  try {
    const { grocery_items, storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required"
      });
    }

    if (!grocery_items || grocery_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No grocery items provided"
      });
    }

    const matched = [];
    const unmatched = [];
    let totalAmount = 0;
    let totalGstAmount = 0;

    // Loop through each grocery item and fetch matching products
    for (const item of grocery_items) {
      const searchTerm = item.product.trim();

      // Find products that match partially (case-insensitive)
      const productsFromDb = await Product.find({
        storeId: storeId,
        name: { $regex: searchTerm, $options: "i" }
      });

      console.log("item" , item);
      

      if (productsFromDb.length > 0) {
        productsFromDb.forEach(dbProduct => {
          const pockets = Number(item.pockets);
          const unitPrice = dbProduct.discountPrice || dbProduct.mrpPrice;
          const totalPrice = unitPrice * pockets;
          const gstAmount = (totalPrice * dbProduct.product_gst_percent) / 100;
          const netQty = item.netQty

          totalAmount += totalPrice;
          totalGstAmount += gstAmount;

          matched.push({
            _id: dbProduct._id,
            name: dbProduct.name,
            productCode: dbProduct.productCode,
            mrpPrice: dbProduct.mrpPrice,
            discountPrice: dbProduct.discountPrice,
            gstPercentage: dbProduct.product_gst_percent,
            pockets,
            unitPrice,
            totalPrice,
            gstAmount,
            netQty
          });
        });
      } else {
        unmatched.push(searchTerm);
      }
    }

    const totalGstPercentage = totalAmount
      ? (totalGstAmount / totalAmount) * 100
      : 0;

    res.json({
      success: true,
      matched,
      unmatched,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalGstAmount: parseFloat(totalGstAmount.toFixed(2)),
      totalGstPercentage: parseFloat(totalGstPercentage.toFixed(2))
    });
  } catch (error) {
    console.error("Error finding products:", error);
    res.status(500).json({ success: false, message: "Server error" });
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


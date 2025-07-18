import Product from "../../modules/storeAdmin/Product.js";
import ProductCategory from "../../modules/storeAdmin/ProductCategory.js";
import SubProduct from "../../modules/storeAdmin/SubProduct.js";

// Add Product
export const addProduct = async (req, res) => {
  try {
    const { name, categoryId, mrpPrice, discountPrice, netQty } = req.body;
    const productImage = req.file?.path || null;

    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Product name is too short to generate code' });
    }

    // 🔁 Check if product with same name and netQty already exists for the same category
    const duplicate = await Product.findOne({ name, categoryId });
    if (duplicate) {
      return res.status(400).json({ message: 'Product with same name already exists' });
    }

    // 🔠 Generate prefix from first 2 letters of name
    const prefix = name.substring(0, 2).toUpperCase();

    // 🔢 Find last product with same prefix and generate next code
    const regex = new RegExp(`^${prefix}\\d{3}$`);
    const lastProduct = await Product.find({ productCode: { $regex: regex } })
      .sort({ productCode: -1 })
      .limit(1);

    let nextNumber = 1;
    if (lastProduct.length > 0) {
      const lastCode = lastProduct[0].productCode;
      const lastNum = parseInt(lastCode.slice(2), 10);
      nextNumber = lastNum + 1;
    }

    const productCode = `${prefix}${String(nextNumber).padStart(3, '0')}`;

    // ✅ Create new product
    const product = new Product({
      name,
      categoryId,
      productImage,
      productCode,
      mrpPrice,
      discountPrice,
      netQty
    });

    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error adding product', error: err.message });
  }
};


// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, mrpPrice, discountPrice, netQty } = req.body;
    const productImage = req.file?.path;

    // Validation
    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    // Check for duplicate (ignore case, exclude self)
    const duplicate = await Product.findOne({
      _id: { $ne: req.params.id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      categoryId
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Product with same name already exists in this category' });
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      categoryId,
      mrpPrice,
      discountPrice,
      netQty
    };

    if (productImage) {
      updateData.productImage = productImage;
    }

    // Avoid accidental overwrite of productCode
    delete updateData.productCode;

    // Update the product
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('categoryId', 'name')

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', data: product });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating product', error: err.message });
  }
};



export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({}).populate('categoryId', 'name');

    const result = await Promise.all(products.map(async (product) => {
      const subProducts = await SubProduct.find({ productId: product._id });
      return {
        ...product.toObject(),
        subProductCount: subProducts.length,
        subProducts
      };
    }));

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching products', error: err.message });
  }
};


export const getProductById = async (req, res) => {
  const { id } = req.params;         // Product ID

  try {
    const product = await Product.findOne(id).populate('categoryId', 'name');

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


export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const products = await Product.find({ categoryId }).populate('categoryId', 'name');

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
    res.status(500).json({ message: 'Error fetching products by category', error: err.message });
  }
};


export const getProductsGroupedByCategory = async (req, res) => {

  try {
    const categories = await ProductCategory.find({ });

    const result = await Promise.all(categories.map(async (category) => {
      const products = await Product.find({ categoryId: category._id }).populate('categoryId', 'name');

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
    res.status(500).json({ message: 'Error grouping products by category', error: err.message });
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


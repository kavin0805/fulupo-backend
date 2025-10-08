import MasterProductCategory from "../../modules/masterAdmin/masterProductCategory.js";
import MasterProducts from "../../modules/masterAdmin/MasterProducts.js";

export const addMasterProduct = async (req, res) => {
  try {
    const { name, categoryId, description } = req.body;

    const productImage = req.file?.path;

    if (!name || !categoryId ) {
      return res
        .status(400)
        .json({ message: "name and categoryId  are required" });
    }

    // ✅ 1. Check if category exists
    const categoryExists = await MasterProductCategory.findById(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }


    const masterProductCheck = await MasterProducts.find();

    const existing = masterProductCheck.find(
      (mprod) => mprod.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (existing) {
      return res
        .status(400)
        .json({ message: "Product with this name already exists" });
    }

    // ✅ 3. Generate unique productCode
    const prefix = name.substring(0, 2).toUpperCase();
    const last = await MasterProducts.find({
      productCode: new RegExp(`^${prefix}\\d{3}$`),
    })
      .sort({ productCode: -1 })
      .limit(1);
    const next = last.length ? parseInt(last[0].productCode.slice(2)) + 1 : 1;
    const productCode = `${prefix}${String(next).padStart(3, "0")}`;

    // ✅ 4. Save new MasterProduct
    const product = new MasterProducts({
      name,
      categoryId,
      productImage,
      description,
      productCode,
    });

    await product.save();
    res.status(201).json({ message: "Master Product created", data: product });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding master product", error: err.message });
  }
};

export const getAllMasterProducts = async (req, res) => {
  const products = await MasterProducts.find().populate('categoryId' , 'name');
  res.json({ count: products.length, data: products });
};

export const getAllMasterProductsByPage = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.body; // take from POST body
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // Build search filter
    let filter = {};
    if (search && search.trim() !== "") {
      filter = {
        name: { $regex: search, $options: "i" }, // case-insensitive
      };
    }

    // Fetch products with pagination + search
    const products = await MasterProducts.find(filter)
      .populate("categoryId", "name")
      .skip(skip)
      .limit(limit);

    // Total count for pagination info (with search applied)
    const totalCount = await MasterProducts.countDocuments(filter);

    res.json({
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      count: products.length,
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching products",
      error: err.message,
    });
  }
};


export const getMasterProductByCategory = async (req, res) => {
  const { categoryId } = req.params;
  const products = await MasterProducts.find({ categoryId });
  res.json({ count: products.length, data: products });
};

export const getGroupedByCategory = async (req, res) => {
  const grouped = await MasterProducts.aggregate([
    {
      $lookup: {
        from: "masterproductcategories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    },
    { $unwind: "$category" },
    {
      $group: {
        _id: "$category.name",
        products: { $push: "$$ROOT" },
      },
    },
  ]);
  res.json(grouped);
};

// ✅ Update Master Product (same structure & checks)
export const updateMasterProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId, description } = req.body || {};
    const productImage = req.file?.path;

    // Find product
    const product = await MasterProducts.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If categoryId is provided, check existence
    if (categoryId) {
      const categoryExists = await MasterProductCategory.findById(categoryId);
      if (!categoryExists) {
        return res.status(404).json({ message: "Category not found" });
      }
    }

    // Check duplicate name (excluding current product)
    if (name) {
      const existing = await MasterProducts.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Product with this name already exists" });
      }
    }

    // Update fields
    if (name) product.name = name;
    if (categoryId) product.categoryId = categoryId;
    if (description) product.description = description;
    if (productImage) product.productImage = productImage;

    await product.save();

    res.json({ message: "Master Product updated", data: product });
  } catch (err) {
    res.status(500).json({
      message: "Error updating master product",
      error: err.message,
    });
  }
};

// ✅ Delete Master Product
export const deleteMasterProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterProducts.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting master product",
      error: err.message,
    });  
  }
};
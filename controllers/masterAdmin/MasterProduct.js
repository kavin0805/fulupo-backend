import MasterProductCategory from "../../modules/masterAdmin/masterProductCategory.js";
import MasterProducts from "../../modules/masterAdmin/MasterProducts.js";

export const addMasterProduct = async (req, res) => {
  try {
    const { name, categoryId, description } = req.body;

    const productImage = req.file?.path;

    if (!name || !categoryId || !productImage) {
      return res
        .status(400)
        .json({ message: "name , categoryId and productImage are required" });
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
  const products = await MasterProducts.find();
  res.json({ count: products.length, data: products });
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

export const updateMasterProduct = async (req, res) => {
  const { id } = req.params;
  const updated = await MasterProducts.findByIdAndUpdate(id, req.body, {
    new: true,
  });
  res.json({ message: "Updated", data: updated });
};

export const deleteMasterProduct = async (req, res) => {
  const { id } = req.params;
  await MasterProducts.findByIdAndDelete(id);
  res.json({ message: "Deleted successfully" });
};

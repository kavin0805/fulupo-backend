import ProductCategory from "../../modules/storeAdmin/ProductCategory.js";

// Add Category
export const addCategory = async (req, res) => {
  const { storeId, name, description } = req.body;
  const icon = req.file?.path;

  try {
    if (!icon) return res.status(400).json({ message: "Icon image is required" });

    const existing = await ProductCategory.findOne({ storeId, name });
    if (existing) return res.status(400).json({ message: 'Category already exists for this store' });

    const category = new ProductCategory({ storeId, name, description, icon });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error adding category', error: err.message });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const icon = req.file?.path;

  try {
    const updateData = { name, description };
    if (icon) updateData.icon = icon;

    const category = await ProductCategory.findByIdAndUpdate(id, updateData, { new: true });

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
};


// Get All Categories
export const getCategories = async (req, res) => {
  try {
    const { storeId } = req.query;
    const filter = storeId ? { storeId } : {};

    const categories = await ProductCategory.find(filter);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};

// Get Category by ID
export const getCategoryById = async (req, res) => {
  const { id } = req.params;       // Category ID
  const { storeId } = req.query;   // Store ID from query string

  try {
    const category = await ProductCategory.findOne({ _id: id, storeId });

    if (!category) {
      return res.status(404).json({ message: 'Category not found for this store' });
    }

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching category', error: err.message });
  }
};

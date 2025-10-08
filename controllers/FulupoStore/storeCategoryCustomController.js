import StoreCategoryCustom from "../../modules/FulupoStore/StoreCategoryCustom.js";

// Add category
export const addStoreCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const icon = req.file?.path;

    if (!name || !icon) {
      return res.status(400).json({ message: 'Name and icon are required' });
    }

    // Check for duplicate category name (case-insensitive)
    // const existingCategory = await StoreCategoryCustom.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    const StoreCategoryCustomCheck = await StoreCategoryCustom.find();

    const existingCategory = StoreCategoryCustomCheck.find(cat =>
  cat.name.trim().toLowerCase() === name.trim().toLowerCase()
);

    if (existingCategory) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const category = new StoreCategoryCustom({ name, icon });
    await category.save();

    res.status(201).json({ message: 'Category added', category });
  } catch (err) {
    res.status(500).json({ message: 'Error adding category', error: err.message });
  }
};


// Get all categories of a store
export const getStoreCategories = async (req, res) => {
  try {
    const categories = await StoreCategoryCustom.find();
    res.json({ data: categories });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching categories', error: err.message });
  }
};


// Update category
export const updateStoreCategory = async (req, res) => {
  try {
    const { name, status } = req.body;
    const icon = req.file?.path;

    const updateData = {};
    if (name) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (icon) updateData.icon = icon;

    const category = await StoreCategoryCustom.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category updated', category });
  } catch (err) {
    res.status(500).json({ message: 'Error updating category', error: err.message });
  }
};


// Delete category
export const deleteStoreCategory = async (req, res) => {
  try {
    const category = await StoreCategoryCustom.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category', error: err.message });
  }
};


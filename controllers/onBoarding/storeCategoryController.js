import StoreCategory from "../../modules/onBoarding/StoreCategory.js";

export const addStoreCategory = async (req, res) => {
  try {
    const category = new StoreCategory({ name: req.body.name });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: 'Error adding category', error: err.message });
  }
};

//  Get Store Categories
export const getStoreCategories = async (req, res) => {
  const categories = await StoreCategory.find();
  res.json({data : categories});
};

export const updateStoreCategory = async (req, res) => {
  try {
    const category = await StoreCategory.findByIdAndUpdate(req.params.id, { name: req.body.name }, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: 'Error updating category', error: err.message });
  }
};

export const deleteStoreCategory = async (req, res) => {
  try {
    const category = await StoreCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting category', error: err.message });
  }
};

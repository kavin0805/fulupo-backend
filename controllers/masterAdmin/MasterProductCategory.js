import MasterProductCategory from "../../modules/masterAdmin/masterProductCategory.js";

export const addMasterProductCategory = async (req, res) => {
   const { name, description } = req.body;
    const icon = req.file?.path;


    try {
      if (!icon) return res.status(400).json({ message: "Icon image is required" });
  
      const existing = await MasterProductCategory.findOne({ name });
      if (existing) return res.status(400).json({ message: 'Category already exists' });

      const category = new MasterProductCategory({ name, description, icon });
      await category.save();
      res.status(201).json(category);
    } catch (err) {
      res.status(500).json({ message: 'Error adding category', error: err.message });
    }
};

export const getAllMasterCategories = async (req, res) => {
  const categories = await MasterProductCategory.find();
  res.json({ count: categories.length, data: categories });
};

export const updateMasterCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    const icon = req.file?.path;
  
    try {
      const updateData = { name, description };
      if (icon) updateData.icon = icon;
  
      const category = await MasterProductCategory.findByIdAndUpdate(id, updateData, { new: true });
  
      if (!category) return res.status(404).json({ message: 'Category not found' });
  
      res.json(category);
    } catch (err) {
      res.status(500).json({ message: 'Error updating category', error: err.message });
    }
};

export const deleteMasterCategory = async (req, res) => {
  const { id } = req.params;
  await MasterProductCategory.findByIdAndDelete(id);
  res.json({ message: 'Deleted successfully' });
};
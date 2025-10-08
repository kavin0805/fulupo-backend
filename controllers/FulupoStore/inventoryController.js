import Inventory from "../../modules/FulupoStore/Inventory.js";

export const getInventoryByStore = async (req, res) => {
  try {
    const { storeId } = req.body;
    // const inventory = await Inventory.find({ storeId })
    //   .populate('product_id', 'name productImage productCode');

const inventory = await Inventory.find({storeId}).populate({
      path: "product_id",
      select: "name productImage productCode masterProductId",
      populate: {
        path: "masterProductId",
        select: "productImage"
      }
    });
      
    res.json({ data: inventory });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inventory by store', error: err.message });
  }
};


export const getInventoryByStoreCategory = async (req, res) => {
  try {
    const { storeId } = req.body;

    if (!storeId ) {
      return res.status(400).json({ message: 'storeId  are required' });
    }

    const inventory = await Inventory.find({ storeId })
      .populate('storeId', 'store_name')
      .populate('product_id', 'name productImage productCode');

    res.json({ data: inventory });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inventory by store and category', error: err.message });
  }
};

export const getInventoryByProduct = async (req, res) => {
  try {
    const { storeId, product_id } = req.body;

    if (!storeId  || !product_id) {
      return res.status(400).json({ message: 'storeId, and product_id are required' });
    }

    const inventory = await Inventory.find({ storeId, product_id })
      .populate('storeId', 'store_name')
      .populate('product_id', 'name productImage productCode');

    res.json({ data: inventory });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching inventory by product', error: err.message });
  }
};





import Inventory from "../../modules/FulupoStore/Inventory.js";
import Wastage from "../../modules/FulupoStore/Wastage.js"
import Product from "../../modules/storeAdmin/Product.js";

// Add Wastage
export const addWastage = async (req, res) => {
  try {
    const { storeId, date, remark, productList } = req.body;
    const parsedProducts = typeof productList === 'string' ? JSON.parse(productList) : productList;

    await Promise.all(parsedProducts.map(async (item) => {
      const inventory = await Inventory.findOne({ storeId, product_id: item.product_id });
      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for product: ${item.product_name}`);
      }

      inventory.quantity -= Number(item.quantity);
      inventory.percentage = (
        (inventory.quantity / (inventory.totalQty)) *
        100
      ).toFixed(2);
      await inventory.save();

      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { showAvlQty: -Number(item.quantity) }
      });
    }));

    const newWastage = new Wastage({
      storeId,
      date,
      remark,
      productList: parsedProducts
    });

    await newWastage.save();
    res.status(201).json({ message: 'Wastage recorded', data: newWastage });
  } catch (err) {
    res.status(500).json({ message: 'Error recording wastage', error: err.message });
  }
};


// Update Wastage
export const updateWastage = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId, date, remark, productList } = req.body;

    const oldWastage = await Wastage.findById(id);
    if (!oldWastage) return res.status(404).json({ message: 'Wastage not found' });

    await Promise.all(oldWastage.productList.map(async (item) => {
      const inventory = await Inventory.findOne({ storeId, product_id: item.product_id });
      if (inventory) {
        inventory.quantity += Number(item.quantity);
        inventory.percentage = ((inventory.quantity / (inventory.quantity + Number(item.quantity))) * 100).toFixed(2);
        await inventory.save();
      }
      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { showAvlQty: Number(item.quantity) }
      });
    }));

    const parsedProducts = typeof productList === 'string' ? JSON.parse(productList) : productList;

    await Promise.all(parsedProducts.map(async (item) => {
      const inventory = await Inventory.findOne({ storeId, product_id: item.product_id });
      if (!inventory || inventory.quantity < item.quantity) {
        throw new Error(`Insufficient quantity for product: ${item.product_name}`);
      }
      inventory.quantity -= Number(item.quantity);
      inventory.percentage = ((inventory.quantity / (inventory.quantity + Number(item.quantity))) * 100).toFixed(2);
      await inventory.save();

      await Product.findByIdAndUpdate(item.product_id, {
        $inc: { showAvlQty: -Number(item.quantity) }
      });
    }));

    const updated = await Wastage.findByIdAndUpdate(id, {
      storeId,
      date,
      remark,
      productList: parsedProducts
    }, { new: true });

    res.json({ message: 'Wastage updated', data: updated });

  } catch (err) {
    res.status(500).json({ message: 'Error updating wastage', error: err.message });
  }
};



// Get all Wastage by store/category
export const getWastage = async (req, res) => {
  try {
    const { storeId } = req.body;
    const filter = {};
    if (storeId) filter.storeId = storeId;

    const wastages = await Wastage.find(filter)
      .populate('storeId', 'store_name')
      .populate({
        path: 'productList.product_id',
        select: 'name masterProductId',
        populate: {
          path: 'masterProductId',
          select: 'productImage name productCode'
        }
      });      

    // Transform the response to flatten productImage
    const data = wastages.map(wastage => ({
      ...wastage.toObject(),
      productList: wastage.productList.map(item => ({
        _id: item._id,
        product_id: item.product_id?._id,
        product_name: item.product_name,
        product_code: item.productCode,
        quantity: item.quantity,
        reason: item.reason,
        productImage: item.product_id?.masterProductId?.productImage || ""
      }))
    }));

      

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching wastage', error: err.message });
  }
};

// Get by period (day/week/month/year)
export const getWastageByPeriod = async (req, res) => {
  try {
    const { type } = req.params;
    const { storeId } = req.body;

    let startDate;
    const endDate = new Date();

    switch (type) {
      case 'day': startDate = new Date(); startDate.setHours(0,0,0,0); break;
      case 'week': startDate = new Date(); startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate = new Date(); startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate = new Date(); startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: return res.status(400).json({ message: 'Invalid period type' });
    }

    const filter = {
      date: { $gte: startDate, $lte: endDate }
    };
    if (storeId) filter.storeId = storeId;

     const wastages = await Wastage.find(filter)
      .populate('storeId', 'store_name')
      .populate({
        path: 'productList.product_id',
        select: 'name masterProductId',
        populate: {
          path: 'masterProductId',
          select: 'productImage name'
        }
      });

    // Transform the response to flatten productImage
    const data = wastages.map(wastage => ({
      ...wastage.toObject(),
      productList: wastage.productList.map(item => ({
        _id: item._id,
        product_id: item.product_id?._id,
        product_name: item.product_name,
        quantity: item.quantity,
        reason: item.reason,
        productImage: item.product_id?.masterProductId?.productImage || ""
      }))
    }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Error filtering wastage', error: err.message });
  }
};

// Get by product
export const getWastageByProduct = async (req, res) => {
  try {
    const { storeId , product_id } = req.body;
     const wastages = await Wastage.find(filter)
      .populate('storeId', 'store_name')
      .populate({
        path: 'productList.product_id',
        select: 'name masterProductId',
        populate: {
          path: 'masterProductId',
          select: 'productImage name'
        }
      });

    // Transform the response to flatten productImage
    const data = wastages.map(wastage => ({
      ...wastage.toObject(),
      productList: wastage.productList.map(item => ({
        _id: item._id,
        product_id: item.product_id?._id,
        product_name: item.product_name,
        quantity: item.quantity,
        reason: item.reason,
        productImage: item.product_id?.masterProductId?.productImage || ""
      }))
    }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching by product', error: err.message });
  }
};

// Get by date range
export const getWastageByDateRange = async (req, res) => {
  try {
    const { from, to, storeId } = req.body;
    const filter = {
      date: { $gte: new Date(from), $lte: new Date(to) }
    };
    if (storeId) filter.storeId = storeId;

     const wastages = await Wastage.find(filter)
      .populate('storeId', 'store_name')
      .populate({
        path: 'productList.product_id',
        select: 'name masterProductId',
        populate: {
          path: 'masterProductId',
          select: 'productImage name'
        }
      });

    // Transform the response to flatten productImage
    const data = wastages.map(wastage => ({
      ...wastage.toObject(),
      productList: wastage.productList.map(item => ({
        _id: item._id,
        product_id: item.product_id?._id,
        product_name: item.product_name,
        product_code:item.productCode,
        quantity: item.quantity,
        reason: item.reason,
        productImage: item.product_id?.masterProductId?.productImage || ""
      }))
    }));
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Error filtering by date range', error: err.message });
  }
};

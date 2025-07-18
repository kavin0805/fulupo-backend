import Inventory from '../../modules/FulupoStore/Inventory.js';
import Purchase from '../../modules/FulupoStore/Purchase.js';
import Vendor from '../../modules/FulupoStore/Vendor.js';
import Product from '../../modules/storeAdmin/Product.js';

// Add Purchase

export const addPurchase = async (req, res) => {
  try {
    const {
      storeId, vendorName, vendorGst, vendorMobile,
      vendorLandline, vendorAddress, purchaseDate,
      purchaseBillNo, overallTotal, product
    } = req.body;

    const bill_image = req.files?.map(file => file.path);
    const parsedProducts = typeof product === 'string' ? JSON.parse(product) : product;

    // ✅ Create Vendor if not exists
    let vendor = await Vendor.findOne({ storeId, name: vendorName });

    if (!vendor) {
      vendor = new Vendor({
        storeId,
        vendorName: vendorName,
        vendorGst: vendorGst,
        vendorMobile: vendorMobile,
        vendorLandline: vendorLandline,
        vendorAddress: vendorAddress
      });
      await vendor.save();
    }

    const enrichedProducts = await Promise.all(parsedProducts.map(async (p) => {
      // ✅ Find or Create Product
      let dbProduct = await Product.findOne({  name: { $regex: new RegExp(`^${p.product_name}$`, 'i') } });

          // 🔠 Generate prefix from first 2 letters of name
    const prefix = p.product_name.substring(0, 2).toUpperCase();

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

      if (!dbProduct) {
        dbProduct = new Product({
          name: p.product_name,
          categoryId: p.categoryId || null, // if category is provided
          productImage: p.product_img || '', // fallback image if any
          purchasePrice: p.product_rate,
          showAvlQty: p.product_qty,
          productCode : productCode
        });
        await dbProduct.save();
      } else {
        // ✅ Update existing product price and available quantity
        dbProduct.purchasePrice = p.product_rate;
        dbProduct.showAvlQty += Number(p.product_qty);
        await dbProduct.save();
      }

      // ✅ Inventory Handling
      let inventory = await Inventory.findOne({ storeId, product_id: dbProduct._id });
      const previousQty = inventory?.quantity || 0;
      const updatedQty = previousQty + Number(p.product_qty);
      const percentage = 100;

      if (inventory) {
        inventory.totalQty = updatedQty;
        inventory.quantity = updatedQty;
        inventory.percentage = percentage;
        await inventory.save();
      } else {
        inventory = new Inventory({
          storeId,
          product_id: dbProduct._id,
          product_img: dbProduct.productImage,
          product_name: p.product_name,
          totalQty: updatedQty,
          quantity: updatedQty,
          product_rate: p.product_rate,
          product_gst_percent: p.product_gst_percent,
          product_amount: p.product_amount,
          percentage
        });
        await inventory.save();
      }

      return {
        product_id: dbProduct._id,
        product_name: p.product_name,
        product_rate: p.product_rate,
        product_qty: p.product_qty,
        product_gst_percent: p.product_gst_percent,
        product_amount: p.product_amount,
        product_img: dbProduct.productImage,
      };
    }));

    const newPurchase = new Purchase({
      storeId,
      vendorName,
      vendorGst,
      vendorMobile,
      vendorLandline,
      vendorAddress,
      purchaseDate,
      purchaseBillNo,
      overallTotal,
      product: enrichedProducts,
      bill_image
    });

    await newPurchase.save();
    res.status(201).json({ message: 'Purchase added successfully', data: newPurchase });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding purchase', error: err.message });
  }
};


export const updatePurchase = async (req, res) => {
  try {
    const {
      storeId,
      vendorName,
      vendorGst,
      vendorMobile,
      vendorLandline,
      vendorAddress,
      purchaseDate,
      purchaseBillNo,
      overallTotal,
      product
    } = req.body;

    const bill_image = req.files?.map(file => file.path);
    const parsedProducts = typeof product === 'string' ? JSON.parse(product) : product;

    const existingPurchase = await Purchase.findById(req.params.id);
    if (!existingPurchase) return res.status(404).json({ message: 'Purchase not found' });

    // Revert old products
    await Promise.all(existingPurchase.product.map(async (oldProd) => {
      const prod = await Product.findByIdAndUpdate(oldProd.product_id, {
        $inc: { showAvlQty: -Number(oldProd.product_qty) }
      });

      const inventory = await Inventory.findOne({ storeId, product_id: oldProd.product_id });
      if (inventory) {
        inventory.quantity -= Number(oldProd.product_qty);
        inventory.percentage = ((inventory.quantity / (inventory.quantity + Number(oldProd.product_qty))) * 100).toFixed(2);
        await inventory.save();
      }
    }));

    // Apply new products
    const enrichedProducts = await Promise.all(parsedProducts.map(async (p) => {
      const dbProduct = await Product.findOneAndUpdate(
        { storeId, name: p.product_name },
        {
          $set: { purchasePrice: p.product_rate },
          $inc: { showAvlQty: Number(p.product_qty) }
        },
        { new: true }
      );

      if (!dbProduct) throw new Error(`Product "${p.product_name}" not found`);

      const inventory = await Inventory.findOne({ storeId, product_id: dbProduct._id });

      if (inventory) {
        inventory.quantity += Number(p.product_qty);
        inventory.percentage = ((inventory.quantity / (inventory.quantity - Number(p.product_qty) + Number(p.product_qty))) * 100).toFixed(2);
        await inventory.save();
      } else {
        const newInventory = new Inventory({
          storeId,
          product_id: dbProduct._id,
          product_img: dbProduct.productImage,
          product_name: p.product_name,
          quantity: Number(p.product_qty),
          product_rate: p.product_rate,
          product_gst_percent: p.product_gst_percent,
          product_amount: p.product_amount,
          percentage: "100"
        });
        await newInventory.save();
      }

      return {
        product_id: dbProduct._id,
        product_img: dbProduct.productImage,
        product_name: p.product_name,
        product_rate: p.product_rate,
        product_qty: p.product_qty,
        product_gst_percent: p.product_gst_percent,
        product_amount: p.product_amount
      };
    }));

    const updateData = {
      storeId,
      vendorName,
      vendorGst,
      vendorMobile,
      vendorLandline,
      vendorAddress,
      purchaseDate,
      purchaseBillNo,
      overallTotal,
      product: enrichedProducts
    };
    if (bill_image) updateData.bill_image = bill_image;

    const updatedPurchase = await Purchase.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ message: 'Purchase updated successfully', data: updatedPurchase });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating purchase', error: err.message });
  }
};

 
// Get All Purchases
export const getAllPurchases = async (req, res) => {
  try {
    const { storeId } = req.body;

    const filter = {};
    if (storeId) filter.storeId = storeId;

    const purchases = await Purchase.find(filter)
      .populate('product.product_id', 'name productImage productCode');

    const enriched = purchases.map(purchase => {
      let totalReturnQty = 0;
      let totalReturnAmount = 0;

      const enrichedProducts = purchase.product.map(prod => {
        const return_qty = prod.return_qty || 0;
        const return_amount = prod.return_amount || 0;
        totalReturnQty += return_qty;
        totalReturnAmount += return_amount;
        return {
          ...prod._doc,
          return_qty,
          return_amount,
          productImage: prod.product_id?.productImage || '',
        };
      });

      return {
        ...purchase._doc,
        product: enrichedProducts,
        totalReturnQty,
        totalReturnAmount
      };
    });

    res.json({ data: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching purchases', error: err.message });
  }
};

// Get Purchase by ID
export const getPurchaseById = async (req, res) => {
  try {  
    const { id, storeId } = req.body;

    const filter = { _id: id };
    if (storeId) filter.storeId = storeId;

    const purchase = await Purchase.findOne(filter).populate('product.product_id', 'name productImage productCode');
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });

    let totalReturnQty = 0;
    let totalReturnAmount = 0;

    const enrichedProducts = purchase.product.map(prod => {
      const return_qty = prod.return_qty || 0;
      const return_amount = prod.return_amount || 0;
      totalReturnQty += return_qty;
      totalReturnAmount += return_amount;
      return { ...prod._doc, return_qty, return_amount };
    });

    res.json({
      data: {
        ...purchase._doc,
        product: enrichedProducts,
        totalReturnQty,
        totalReturnAmount
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error getting purchase', error: err.message });
  }
};


// Filter by Day/Week/Month/Year
export const getPurchasesByPeriod = async (req, res) => {
  try {
    const { type } = req.params;
    const { storeId } = req.body;

    let startDate = new Date();
    const endDate = new Date();

    switch (type) {
      case 'day': startDate.setHours(0, 0, 0, 0); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
      default: return res.status(400).json({ message: 'Invalid filter type' });
    }

    const query = {
      purchaseDate: { $gte: startDate, $lte: endDate },
      ...(storeId && { storeId })
    };

    const purchases = await Purchase.find(query).populate('product.product_id', 'name productImage productCode');

    const enriched = purchases.map(p => {
      let totalReturnQty = 0;
      let totalReturnAmount = 0;

      const enrichedProducts = p.product.map(prod => {
        const return_qty = prod.return_qty || 0;
        const return_amount = prod.return_amount || 0;
        totalReturnQty += return_qty;
        totalReturnAmount += return_amount;
        return { ...prod._doc, return_qty, return_amount };
      });

      return {
        ...p._doc,
        product: enrichedProducts,
        totalReturnQty,
        totalReturnAmount
      };
    });

    res.json({ count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Error filtering purchases', error: err.message });
  }
};


// Filter by Date Range
export const getPurchasesByDateRange = async (req, res) => {
  try {
    const { from, to, storeId } = req.body;

    const query = {
      purchaseDate: {
        $gte: new Date(from),
        $lte: new Date(to)
      },
      ...(storeId && { storeId })
    };

    const purchases = await Purchase.find(query).populate('product.product_id', 'name productImage productCode');

    const enriched = purchases.map(p => {
      let totalReturnQty = 0;
      let totalReturnAmount = 0;

      const enrichedProducts = p.product.map(prod => {
        const return_qty = prod.return_qty || 0;
        const return_amount = prod.return_amount || 0;
        totalReturnQty += return_qty;
        totalReturnAmount += return_amount;
        return { ...prod._doc, return_qty, return_amount };
      });

      return {
        ...p._doc,
        product: enrichedProducts,
        totalReturnQty,
        totalReturnAmount
      };
    });

    res.json({ count: enriched.length, data: enriched });
  } catch (err) {
    res.status(500).json({ message: 'Error filtering by date range', error: err.message });
  }
};



export const getPurchasesByVendor = async (req, res) => {
  try {
    const { storeId, vendorName } = req.body;

    if (!storeId || !vendorName) {
      return res.status(400).json({ message: 'Store ID and Vendor Name are required' });
    }

    const purchases = await Purchase.find({ storeId, vendorName })
      .populate('product.product_id', 'name productImage productCode');

    if (!purchases || purchases.length === 0) {
      return res.status(404).json({ message: 'No purchases found for this vendor' });
    }

    res.json({ count: purchases.length, data: purchases });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching purchases by vendor', error: err.message });
  }
};

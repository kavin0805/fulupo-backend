import Inventory from "../../modules/FulupoStore/Inventory.js";
import Sales from "../../modules/FulupoStore/Sales.js";
import Product from "../../modules/storeAdmin/Product.js";

export const addSale = async (req, res) => {
  try {
    const { storeId, customerName, customerMobile, products } = req.body;

    let totalGst = 0;
    let totalAmount = 0;
    const saleProducts = [];

    for (const p of products) {
      const product = await Product.findById(p.product_id);
      if (!product) throw new Error(`Product not found: ${p.product_id}`);


      const unitPrice = product.discountPrice || product.mrpPrice;
      const gstPercent = product.purchasePrice ? Number(p.gst_percent) || 0 : 0;
      const gstAmount = (unitPrice * p.quantity * gstPercent) / 100;
      const total = unitPrice * p.quantity + gstAmount;

      const inventory = await Inventory.findOne({
        storeId,
        product_id: product._id,
      });
      if (!inventory || inventory.quantity < p.quantity) {
        throw new Error(`Insufficient inventory for ${product.name}`);
      }

      inventory.quantity -= p.quantity;
      inventory.percentage = (
        (inventory.quantity / (inventory.totalQty)) *
        100
      ).toFixed(2);
      await inventory.save();

      product.showAvlQty -= p.quantity;
      await product.save();

      totalGst += gstAmount;
      totalAmount += total;

      saleProducts.push({
        product_id: product._id,
        product_name: product.name,
        product_code: product.productCode,
        unit_price: unitPrice,
        quantity: p.quantity,
        gst_percent: gstPercent,
        gst_amount: gstAmount,
        total,
      });
    }

    const newSale = new Sales({
      storeId,
      customerName,
      customerMobile,
      totalGst,
      totalAmount,
      products: saleProducts,
    });


    await newSale.save();
    res.status(201).json({ message: "Sale completed", data: newSale });
  } catch (err) {
    res.status(500).json({ message: "Error adding sale", error: err.message });
  }
};

export const getSalesByStore = async (req, res) => {
  try {
    const { storeId } = req.body;

    const filter = {};
    if (storeId) filter.storeId = storeId;

   let sales = await Sales.find(filter)
      .populate("storeId", "store_name")
      .populate({
        path: "products.product_id",
        select: "name masterProductId product_code", // also populate product_code if stored here
        populate: {
          path: "masterProductId",
          select: "productImage name",
        },
      });

    // Reshape the data to bring productImage to product level
    sales = sales.map((sale) => {
      const newProducts = sale.products.map((p) => {
        const productObj = p.toObject ? p.toObject() : p;
        return {
          ...productObj,
          product_name: productObj.product_name || productObj.product_id?.name,
          product_code: productObj.product_code,
          productImage: productObj.product_id?.masterProductId?.productImage || "",
        };
      });

      return {
        ...sale.toObject(),
        products: newProducts,
      };
    });

    res.json({ count: sales.length, data: sales });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error fetching sales by store/category",
        error: err.message,
      });
  }
};

export const getSalesByPeriod = async (req, res) => {
  try {
    const { type } = req.params;
    const { storeId } = req.body;

    let startDate;
    const endDate = new Date();

    switch (type) {
      case "day":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        return res.status(400).json({ message: "Invalid filter type" });
    }

    const query = {
      saleDate: { $gte: startDate, $lte: endDate },
    };

    if (storeId) query.storeId = storeId;

    let sales = await Sales.find(query)
      .populate("storeId", "store_name")
      .populate({
        path: "products.product_id",
        select: "name masterProductId product_code", // also populate product_code if stored here
        populate: {
          path: "masterProductId",
          select: "productImage name",
        },
      });

    // Reshape the data to bring productImage to product level
    sales = sales.map((sale) => {
      const newProducts = sale.products.map((p) => {
        const productObj = p.toObject ? p.toObject() : p;
        return {
          ...productObj,
          product_name: productObj.product_name || productObj.product_id?.name,
          product_code: productObj.product_code,
          productImage: productObj.product_id?.masterProductId?.productImage || "",
        };
      });

      return {
        ...sale.toObject(),
        products: newProducts,
      };
    });

    res.json({ count: sales.length, data: sales });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error filtering sales by period", error: err.message });
  }
};

export const getSalesByCustomerMobile = async (req, res) => {
  try {
    const { customerMobile  , storeId } = req.body;

    if (!customerMobile) {
      return res.status(400).json({ message: "Customer mobile is required" });
    }

     let sales = await Sales.find({customerMobile , storeId })
      .populate("storeId", "store_name")
      .populate({
        path: "products.product_id",
        select: "name masterProductId product_code", // also populate product_code if stored here
        populate: {
          path: "masterProductId",
          select: "productImage name",
        },
      });

    // Reshape the data to bring productImage to product level
    sales = sales.map((sale) => {
      const newProducts = sale.products.map((p) => {
        const productObj = p.toObject ? p.toObject() : p;
        return {
          ...productObj,
          product_name: productObj.product_name || productObj.product_id?.name,
          product_code: productObj.product_code,
          productImage: productObj.product_id?.masterProductId?.productImage || "",
        };
      });

      return {
        ...sale.toObject(),
        products: newProducts,
      };
    });

    res.json({ count: sales.length, data: sales });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error fetching sales by customer",
        error: err.message,
      });
  }
};

export const getSalesByDateRange = async (req, res) => {
  try {
    const { from, to, storeId } = req.body;

    const query = {
      saleDate: {
        $gte: new Date(from),
        $lte: new Date(to),
      },
    };

    if (storeId) query.storeId = storeId;

     let sales = await Sales.find(query)
      .populate("storeId", "store_name")
      .populate({
        path: "products.product_id",
        select: "name masterProductId product_code", // also populate product_code if stored here
        populate: {
          path: "masterProductId",
          select: "productImage name",
        },
      });

    // Reshape the data to bring productImage to product level
    sales = sales.map((sale) => {
      const newProducts = sale.products.map((p) => {
        const productObj = p.toObject ? p.toObject() : p;
        return {
          ...productObj,
          product_name: productObj.product_name || productObj.product_id?.name,
          product_code: productObj.product_code,
          productImage: productObj.product_id?.masterProductId?.productImage || "",
        };
      });

      return {
        ...sale.toObject(),
        products: newProducts,
      };
    });

    res.json({ count: sales.length, data: sales });
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error filtering sales by date range",
        error: err.message,
      });
  }
};

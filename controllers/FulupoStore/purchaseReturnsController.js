import Inventory from "../../modules/FulupoStore/Inventory.js";
import Purchase from "../../modules/FulupoStore/Purchase.js";
import PurchaseReturns from "../../modules/FulupoStore/PurchaseReturns.js";
import Product from "../../modules/storeAdmin/Product.js";
import mongoose from "mongoose";
import moment from "moment-timezone";
import Vendor from "../../modules/FulupoStore/Vendor.js";

export const addPurchaseReturn = async (req, res) => {
  try {
    const { storeId, vendorName, products, reason } = req.body;

    if (
      !storeId ||
      !vendorName ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const returnSummary = [];

    for (const product of products) {
      const { product_id, returnQty } = product;

      const inventory = await Inventory.findOne({ storeId, product_id });

      if (!inventory || inventory.quantity < Number(returnQty)) {
        returnSummary.push({
          product_id,
          status: "Failed",
          message: `Not enough inventory. Available: ${
            inventory?.quantity || 0
          }`,
        });
        continue;
      }

      let remainingQty = Number(returnQty);
      let totalReturnAmount = 0;
      const returnDetails = [];

      const purchaseBills = await Purchase.find({
        storeId,
        vendorName,
        "product.product_id": product_id,
      }).sort({ purchaseDate: -1 });

      for (const bill of purchaseBills) {
        const productEntry = bill.product.find(
          (p) => p.product_id.toString() === product_id
        );

        if (!productEntry) continue;

        const availableQty =
          productEntry.product_qty - (productEntry.return_qty || 0);
        if (availableQty <= 0) continue;

        const qtyToReturn = Math.min(availableQty, remainingQty);
        const amountToReduce = qtyToReturn * productEntry.product_rate;

        productEntry.return_qty = (productEntry.return_qty || 0) + qtyToReturn;
        productEntry.return_amount =
          (productEntry.return_amount || 0) + amountToReduce;
        productEntry.product_qty -= qtyToReturn;
        productEntry.product_amount -= amountToReduce;
        bill.overallTotal -= amountToReduce;

        await bill.save();

        totalReturnAmount += amountToReduce;
        remainingQty -= qtyToReturn;

        returnDetails.push({
          purchaseId: bill._id,
          qty: qtyToReturn,
          rate: productEntry.product_rate,
          amount: amountToReduce,
        });

        if (remainingQty === 0) break;
      }

      if (returnDetails.length === 0) {
        returnSummary.push({
          product_id,
          status: "Failed",
          message: "No matching purchase bill found",
        });
        continue;
      }

      // Update Inventory
      await Inventory.findOneAndUpdate(
        { storeId, product_id },
        { $inc: { quantity: -Number(returnQty) } },
        { new: true }
      );

      // Update Product available qty
      await Product.findByIdAndUpdate(
        product_id,
        { $inc: { showAvlQty: -Number(returnQty) } },
        { new: true }
      );

      const productData = await Product.findById(product_id).select("name");

      // Save to Purchase Return
      const returnRecord = new PurchaseReturns({
        storeId,
        vendorName,
        reason,
        returnDate: new Date(),
        product: [
          {
            product_id,
            product_name: productData.name || "", // pass name if available
            return_qty: returnQty,
            product_rate: returnDetails[0]?.rate || 0,
            product_amount: totalReturnAmount,
          },
        ],
      });

      await returnRecord.save();

      returnSummary.push({
        product_id,
        status: "Success",
        returnQty,
        totalReturnAmount,
        returnDetails,
      });
    }

    res.status(201).json({
      message: "Purchase return processed",
      summary: returnSummary,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error processing purchase return",
      error: err.message,
    });
  }
};

export const getAllPurchaseReturns = async (req, res) => {
  try {
    const { storeId } = req.body;

    const filter = {};
    if (storeId) filter.storeId = storeId;

    const returns = await PurchaseReturns.find(filter)
      .populate({
        path: "product.product_id",
        select: "name productImage productCode",
      })
      .sort({ returnDate: -1 });

    res.json({ count: returns.length, data: returns });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching purchase returns", error: err.message });
  }
};

export const getPurchaseReturnsByPeriod = async (req, res) => {
  try {
    const { storeId, type, from, to } = req.body;

    if (!storeId || !type) {
      return res.status(400).json({ message: "storeId and type are required" });
    }

    let startDate = moment.tz("Asia/Kolkata").startOf("day");
    let endDate = moment.tz("Asia/Kolkata").endOf("day");

    switch (type) {
      case "day":
        // already today
        break;
      case "week":
        startDate = startDate.subtract(7, "days").startOf("day");
        break;
      case "month":
        startDate = startDate.subtract(1, "months").startOf("day");
        break;
      case "year":
        startDate = startDate.subtract(1, "years").startOf("day");
        break;
      case "range":
        if (!from || !to) {
          return res
            .status(400)
            .json({ message: "from and to dates are required for range" });
        }
        startDate = moment.tz(from, "Asia/Kolkata").startOf("day");
        endDate = moment.tz(to, "Asia/Kolkata").endOf("day");
        break;
      default:
        return res.status(400).json({
          message: "Invalid type. Use day, week, month, year, or range",
        });
    }

    const returns = await PurchaseReturns.find({
      storeId: new mongoose.Types.ObjectId(storeId),
      returnDate: {
        $gte: startDate.toDate(),
        $lte: endDate.toDate(),
      },
    }).populate({
        path: "product.product_id",
        select: "name productImage productCode",
      })
      .sort({ returnDate: -1 });

    // Summary
    let totalReturnQty = 0;
    let totalReturnAmount = 0;
    returns.forEach((r) => {
      totalReturnQty += r.returnQty || 0;
      totalReturnAmount += r.totalReturnAmount || 0;
    });

    res.json({
      timePeriod: {
        type,
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary: {
        totalReturnQty,
        totalReturnAmount,
      },
      count: returns.length,
      data: returns,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Error fetching returns by period",
      error: err.message,
    });
  }
};

export const getVendorsByProductAndStore = async (req, res) => {
  try { 
    const { storeId, productId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(storeId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).json({ message: "Invalid storeId or productId" });
    }

    // 🔍 Find purchases for the product in the specific store
    const purchases = await Purchase.find({
      storeId: storeId,
      "product.product_id": productId,
    });

    if (!purchases.length) {
      return res
        .status(404)
        .json({ message: "No vendors found for this product in this store" });
    }

    // 🧠 Extract unique vendor names (or use vendorId if available)
    const vendorNames = [...new Set(purchases.map((p) => p.vendorName))];

    // 🔄 Fetch vendor details
    const vendors = await Vendor.find({
      storeId,
      vendorName: { $in: vendorNames },
    }).select("vendorName vendorGst vendorMobile vendorLandline vendorAddress");

    res.json({ count: vendors.length, data: vendors });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error fetching vendor details", error: err.message });
  }
};

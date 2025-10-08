import moment from "moment-timezone";
import {
  fetchProfitLossSummary,
  fetchPurchaseSummary,
  fetchSalesSummary,
  fetchStoreOverview,
  fetchWastageSummary,
} from "../../services/summaryService.js";
import Purchase from "../../modules/FulupoStore/Purchase.js";
import Sales from "../../modules/FulupoStore/Sales.js";
import Wastage from "../../modules/FulupoStore/Wastage.js";
import mongoose from "mongoose";

export const getOverallSummary = async (req, res) => {
  try {
    const { storeId, type, from, to } = req.body;
    if (!storeId) return res.status(400).json({ message: 'Store ID is required' });

    let startDate = moment.tz('Asia/Kolkata').startOf('day');
    let endDate = moment.tz('Asia/Kolkata').endOf('day');

    switch (type) {
      case 'day': break;
      case 'week': startDate.subtract(7, 'days'); break;
      case 'month': startDate.subtract(1, 'months'); break;
      case 'year': startDate.subtract(1, 'years'); break;
      case 'range':
        if (!from || !to) return res.status(400).json({ message: 'From and To dates required' });
        startDate = moment.tz(from, 'Asia/Kolkata').startOf('day');
        endDate = moment.tz(to, 'Asia/Kolkata').endOf('day');
        break;
      default:
        return res.status(400).json({ message: 'Invalid type (day/week/month/year/range)' });
    }

    const start = startDate.toDate();
    const end = endDate.toDate();

    // === PURCHASE ===
    const purchases = await Purchase.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), purchaseDate: { $gte: start, $lte: end } } },
      { $unwind: "$product" },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate", timezone: "Asia/Kolkata" } }
          },
          totalPurchaseQty: { $sum: "$product.product_qty" },
          totalPurchaseCost: { $sum: { $multiply: ["$product.product_qty", "$product.product_rate"] } }
        }
      }
    ]);

    // === SALES ===
    const sales = await Sales.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: start, $lte: end } } },
      { $unwind: "$products" },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate", timezone: "Asia/Kolkata" } }
          },
          totalSalesQty: { $sum: "$products.quantity" },
          totalSalesAmount: { $sum: { $multiply: ["$products.unit_price", "$products.quantity"] } }
        }
      }
    ]);

    // === WASTAGE ===
        const wastages = await Wastage.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), date: { $gte: start, $lte: end } } },
      { $unwind: "$productList" },
      { $lookup: { from: "products", localField: "productList.product_id", foreignField: "_id", as: "productDetails"}},
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } }
          },
          totalWastageQty: { $sum: "$productList.quantity" },
          totalWastageCost: {
            $sum: { $multiply: ["$productList.quantity", "$productDetails.purchasePrice"] }
          }
        }
      }
    ]);  

    // === MERGE ALL DATA ===
    const summaryMap = new Map();

    const mergeData = (arr, mapper) => {
      for (const item of arr) {
        const date = item._id.date;
        if (!summaryMap.has(date)) summaryMap.set(date, { date });
        Object.assign(summaryMap.get(date), mapper(item));
      }
    };

    mergeData(purchases, e => ({
      totalPurchaseQty: e.totalPurchaseQty,
      totalPurchaseCost: e.totalPurchaseCost
    }));

    mergeData(sales, e => ({
      totalSalesQty: e.totalSalesQty,
      totalSalesAmount: e.totalSalesAmount
    }));

    mergeData(wastages, e => ({
      totalWastageQty: e.totalWastageQty,
      totalWastageCost: e.totalWastageCost
    }));

    // Final result array
    const summary = Array.from(summaryMap.values()).map(entry => {
      const {
        date,
        totalPurchaseQty = 0,
        totalPurchaseCost = 0,
        totalSalesQty = 0,
        totalSalesAmount = 0,
        totalWastageQty = 0,
        totalWastageCost = 0
      } = entry;

      const profit = totalSalesAmount - (totalPurchaseCost + totalWastageCost);

      return {
        date,
        totalPurchaseQty,
        totalPurchaseCost,
        totalSalesQty,
        totalSalesAmount,
        totalWastageQty,
        totalWastageCost,
        profit
      };
    });

    // === OVERALL TOTAL ===
    const overall = summary.reduce((acc, curr) => {
      acc.totalPurchaseQty += curr.totalPurchaseQty;
      acc.totalPurchaseCost += curr.totalPurchaseCost;
      acc.totalSalesQty += curr.totalSalesQty;
      acc.totalSalesAmount += curr.totalSalesAmount;
      acc.totalWastageQty += curr.totalWastageQty;
      acc.totalWastageCost += curr.totalWastageCost;
      acc.overallProfit += curr.profit;
      return acc;
    }, {
      totalPurchaseQty: 0,
      totalPurchaseCost: 0,
      totalSalesQty: 0,
      totalSalesAmount: 0,
      totalWastageQty: 0,
      totalWastageCost: 0,
      overallProfit: 0
    });

    res.json({
      timePeriod: { type, from: start, to: end },
      data: summary.sort((a, b) => new Date(a.date) - new Date(b.date)),
      overall
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error calculating summary', error: err.message });
  }
};
  
export const getStoreOverviewSummary = async (req, res) => {
  try {
    const result = await fetchStoreOverview(req.body.storeId);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching store overview", error: err.message });
  }
};

export const getSalesSummary = async (req, res) => {
  try {
    const result = await fetchSalesSummary(req.body);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching sales summary", error: err.message });
  }
};

export const getPurchaseSummary = async (req, res) => {
  try {
    const result = await fetchPurchaseSummary(req.body);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching purchase summary", error: err.message });
  }
};

export const getWastageSummary = async (req, res) => {
  try {
    const result = await fetchWastageSummary(req.body);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching wastage summary", error: err.message });
  }
};

export const getProfitLossSummary = async (req, res) => {
  try {
    const result = await fetchProfitLossSummary(req.body);
    res.json(result);
  } catch (err) {
    res
      .status(500)
      .json({
        message: "Error fetching profit/loss summary",
        error: err.message,
      });
  }
};

import mongoose from 'mongoose';
import Product from '../../modules/storeAdmin/Product.js';
import Wastage from '../../modules/FulupoStore/Wastage.js';
import Sales from '../../modules/FulupoStore/Sales.js';
import Purchase from '../../modules/FulupoStore/Purchase.js';
import moment from 'moment-timezone';


export const getAllProductProfitLoss = async (req, res) => {
  try {
    const { storeId, type, from, to } = req.body;
    if (!storeId) return res.status(400).json({ message: 'Store ID required' });

    let startDate;
    let endDate;
 
    switch (type) {
      case 'day':
        startDate = moment.tz('Asia/Kolkata').startOf('day').toDate();
        endDate = moment.tz('Asia/Kolkata').endOf('day').toDate();
        break;

      case 'week':
        startDate = moment.tz('Asia/Kolkata').subtract(7, 'days').startOf('day').toDate();
        endDate = moment.tz('Asia/Kolkata').endOf('day').toDate();
        break;

      case 'month':
        startDate = moment.tz('Asia/Kolkata').subtract(1, 'month').startOf('day').toDate();
        endDate = moment.tz('Asia/Kolkata').endOf('day').toDate();
        break;

      case 'year':
        startDate = moment.tz('Asia/Kolkata').subtract(1, 'year').startOf('day').toDate();
        endDate = moment.tz('Asia/Kolkata').endOf('day').toDate();
        break;

      case 'range':
        if (!from || !to) return res.status(400).json({ message: 'From and To dates required for range' });
        startDate = moment.tz(from, 'Asia/Kolkata').startOf('day').toDate();
        endDate = moment.tz(to, 'Asia/Kolkata').endOf('day').toDate();
        break;

      default:
        return res.status(400).json({ message: 'Invalid type (day/week/month/year/range)' });
    }
    

    const products = await Product.find({ storeId });
    const results = await Promise.all(products.map(async (product) => {
      const productId = product._id;

      const [purchase] = await Purchase.aggregate([
        {
          $match: {
            storeId: new mongoose.Types.ObjectId(storeId),
            purchaseDate: { $gte: startDate, $lte: endDate }
          }
        },
        { $unwind: '$product' },
        { $match: { 'product.product_id': productId } },
        {
          $group: {
            _id: null,
            totalPurchase: {
              $sum: { $multiply: ['$product.product_qty', '$product.product_rate'] }
            }
          }
        }
      ]);       

      const [sale] = await Sales.aggregate([
        {
          $match: {
            storeId: new mongoose.Types.ObjectId(storeId),
            saleDate: { $gte: startDate, $lte: endDate }
          }
        },
        { $unwind: '$products' },
        { $match: { 'products.product_id': productId } },
        {
          $group: {
            _id: null,
            totalSale: {
              $sum: { $multiply: ['$products.unit_price', '$products.quantity'] }
            }
          }
        }
      ]);

      const [wastage] = await Wastage.aggregate([
        {
          $match: {
            storeId: new mongoose.Types.ObjectId(storeId),
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $unwind: '$productList' },
        { $match: { 'productList.product_id': new mongoose.Types.ObjectId(productId) } },
        {
          $group: {
            _id: null,
            totalWastageQty: { $sum: '$productList.quantity' }
          }
        }
      ]);

      const purchaseAmount = purchase?.totalPurchase || 0;
      const saleAmount = sale?.totalSale || 0;
      const wastageQty = wastage?.totalWastageQty || 0;
      const wastageLoss = wastageQty * (product.purchasePrice || 0);
      const profit = saleAmount - (purchaseAmount + wastageLoss);

      return {
        productId: product._id,
        productName: product.name,
        productCode: product.productCode,
        productImage: product.productImage,
        totalPurchase: purchaseAmount,
        totalSale: saleAmount,
        totalWastage: wastageLoss,
        profit
      };
    }));

    res.json({
      timePeriod: {
        type,
        from: moment(startDate).format('YYYY-MM-DD HH:mm:ss'),
        to: moment(endDate).format('YYYY-MM-DD HH:mm:ss')
      },
      data: results
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error calculating profit/loss', error: err.message });
  }
};



// 📦 Get profit/loss for single product
export const getSingleProductProfitLoss = async (req, res) => {
  try {
    const { storeId, productId, type, from, to } = req.body;
    let startDate = new Date();
    const endDate = new Date();

    switch (type) {
      case 'day': startDate.setHours(0, 0, 0, 0); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
      case 'year': startDate.setFullYear(startDate.getFullYear() - 1); break;
      case 'range':
        if (!from || !to) return res.status(400).json({ message: 'From and To required' });
        startDate = new Date(from);
        endDate.setTime(new Date(to).getTime());
        break;
      default: return res.status(400).json({ message: 'Invalid period type' });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const [purchase] = await Purchase.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), purchaseDate: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$product' },
      { $match: { 'product.product_id': new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, totalPurchase: { $sum: { $multiply: ['$product.product_qty', '$product.product_rate'] } } } }
    ]);

    const [sale] = await Sales.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), saleDate: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$productList' },
      { $match: { 'productList.product_id': new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, totalSale: { $sum: { $multiply: ['$productList.product_price', '$productList.product_qty'] } } } }
    ]);

    const [wastage] = await Wastage.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId), date: { $gte: startDate, $lte: endDate } } },
      { $unwind: '$productList' },
      { $match: { 'productList.product_id': new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, totalWastageQty: { $sum: '$productList.quantity' } } }
    ]);

    const purchaseAmount = purchase?.totalPurchase || 0;
    const saleAmount = sale?.totalSale || 0;
    const wastageLoss = (wastage?.totalWastageQty || 0) * (product.purchasePrice || 0);
    const profit = saleAmount - (purchaseAmount + wastageLoss);

    res.json({
      timePeriod: { type, from: startDate, to: endDate },
      product: {
        productId,
        productName: product.name,
        productCode: product.productCode,
        totalPurchase: purchaseAmount,
        totalSale: saleAmount,
        totalWastage: wastageLoss,
        profit
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product profit/loss', error: err.message });
  }
};

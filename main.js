import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './lib/db.js';
import createInitialAdmin from './intiAdmin.js';
import storeRoutes from './routes/onBoarding/storeRoutes.js'
import authRoutes from './routes/onBoarding/authRoutes.js'
// import masterAuthRoutes from './routes/storeAdmin/masterAuthRoutes.js'
import productCategoryRoutes from './routes/storeAdmin/productCategoryRoutes.js'
import productRoutes from './routes/storeAdmin/productRoutes.js'
import subProductRoutes from './routes/storeAdmin/subProductRoutes.js'
import storeAuthRoutes from './routes/FulupoStore/storeAuthRoutes.js'
import storeCategoryCustomRoutes from './routes/FulupoStore/storeCategoryCustomRoutes.js'
import purchaseRoutes from './routes/FulupoStore/purchaseRoutes.js'
import InventoryRoutes from './routes/FulupoStore/InventoryRoutes.js'
import salesRoutes from './routes/FulupoStore/salesRoutes.js'
import wastageRoutes from './routes/FulupoStore/wastageRoutes.js'
import profitLossRoutes from './routes/FulupoStore/profitLossRoutes.js'
import summaryRoutes from './routes/FulupoStore/summaryRoutes.js'
import purchaseReturnRoutes from './routes/FulupoStore/purchaseReturnRoutes.js'
import vendorRoutes from './routes/FulupoStore/vendorRoutes.js'
import gsmProductRoutes from './routes/onBoarding/gsmProductRoutes.js'
import MasterAdminRoutes from './routes/masterAdmin/MasterAdminRoutes.js'
import MasterAdminptdCatRoutes from './routes/masterAdmin/masterAdminPtdCatRoutes.js'
import masterAdminAuthRoutes from './routes/masterAdmin/masterAdminAuthRoutes.js'
import voiceRoutes from './routes/FulupoStore/voiceRoutes.js'
import consumerAuthRoutes from './routes/consumer/consumerAuthRoutes.js'
import wishListRoutes from './routes/consumer/wishListRoutes.js'
import cartRoutes from './routes/consumer/cartRoutes.js'
import consumerAddressRoutes from './routes/consumer/consumerAddressRoutes.js'
import orderRoutes from './routes/consumer/orderRoutes.js'
import replacementRoutes from './routes/consumer/replacementRoutes.js'

const app = express();
dotenv.config();
// Data understanding middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Ensure the functions that are async are properly awaited
const startServer = async () => {
  try {
    await connectDB();
    await createInitialAdmin();
    // console.log("Connected to DB and initialized admin");

    app.get("/", (req, res) => res.send("API Running"));

    // for onBoarding
    app.use('/api/auth', authRoutes);
    app.use('/api/store', storeRoutes);
    app.use('/api/gsm', gsmProductRoutes);
  
    // for masterAdmin
    app.use('/api/masteradmin' , masterAdminAuthRoutes)
    app.use('/api/masterAdminProducts', MasterAdminRoutes);
    app.use('/api/masterAdminPdtCat', MasterAdminptdCatRoutes);

    //for storeAdmin
    app.use('/api/category' , productCategoryRoutes)
    app.use('/api/products' , productRoutes)
    app.use('/api/subProducts' , subProductRoutes)

    // for Fulupo Store
    app.use('/api/auth' , storeAuthRoutes)
    app.use('/api/cat' , storeCategoryCustomRoutes)
    app.use('/api/purchase' , purchaseRoutes)
    app.use('/api/inventory' , InventoryRoutes)
    app.use('/api/sales' , salesRoutes)
    app.use('/api/wastage' , wastageRoutes)
    app.use('/api/profit-loss', profitLossRoutes);
    app.use('/api/summary', summaryRoutes);
    app.use('/api/purchase-return', purchaseReturnRoutes);
    app.use('/api/vendor', vendorRoutes);

    // for grocery
    app.use("/api/grocery", voiceRoutes);

    // for consumer 
    app.use("/api/consumer", consumerAuthRoutes);
    app.use("/api/consumer/wishList", wishListRoutes);
    app.use("/api/consumer/cart", cartRoutes);
    app.use("/api/consumer/address", consumerAddressRoutes);
    app.use("/api/consumer/order", orderRoutes);
    app.use("/api/consumer/exchange", replacementRoutes);




    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Call startServer to initialize and run the app
startServer();

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./lib/db.js";
import createInitialAdmin from "./intiAdmin.js";
import { Server } from "socket.io";
import http from "http";
import storeRoutes from "./routes/onBoarding/storeRoutes.js";
import authRoutes from "./routes/onBoarding/authRoutes.js";
// import masterAuthRoutes from './routes/storeAdmin/masterAuthRoutes.js'
import productCategoryRoutes from "./routes/storeAdmin/productCategoryRoutes.js";
import productRoutes from "./routes/storeAdmin/productRoutes.js";
import subProductRoutes from "./routes/storeAdmin/subProductRoutes.js";
import storeAuthRoutes from "./routes/FulupoStore/storeAuthRoutes.js";
import storeCategoryCustomRoutes from "./routes/FulupoStore/storeCategoryCustomRoutes.js";
import purchaseRoutes from "./routes/FulupoStore/purchaseRoutes.js";
import InventoryRoutes from "./routes/FulupoStore/InventoryRoutes.js";
import salesRoutes from "./routes/FulupoStore/salesRoutes.js";
import wastageRoutes from "./routes/FulupoStore/wastageRoutes.js";
import profitLossRoutes from "./routes/FulupoStore/profitLossRoutes.js";
import summaryRoutes from "./routes/FulupoStore/summaryRoutes.js";
import purchaseReturnRoutes from "./routes/FulupoStore/purchaseReturnRoutes.js";
import vendorRoutes from "./routes/FulupoStore/vendorRoutes.js";
import gsmProductRoutes from "./routes/onBoarding/gsmProductRoutes.js";
import MasterAdminRoutes from "./routes/masterAdmin/MasterAdminRoutes.js";
import MasterAdminptdCatRoutes from "./routes/masterAdmin/masterAdminPtdCatRoutes.js";
import masterAdminAuthRoutes from "./routes/masterAdmin/masterAdminAuthRoutes.js";
import voiceRoutes from "./routes/FulupoStore/voiceRoutes.js";
import consumerAuthRoutes from "./routes/consumer/consumerAuthRoutes.js";
import wishListRoutes from "./routes/consumer/wishListRoutes.js";
import cartRoutes from "./routes/consumer/cartRoutes.js";
import consumerAddressRoutes from "./routes/consumer/consumerAddressRoutes.js";
import orderRoutes from "./routes/consumer/orderRoutes.js";
import replacementRoutes from "./routes/consumer/replacementRoutes.js";
import storeDeliveryPersonRoutes from "./routes/storeAdmin/deliveryPersonRoutes.js";
import deliveryPersonRoutes from "./routes/delivery/deliveryPersonRoutes.js";
import storeOrderRoutes from "./routes/storeAdmin/orderRoutes.js";
import storeSlotRoutes from "./routes/storeAdmin/storeSlotRoutes.js";
import MasterAdminSlotTemplateRoutes from "./routes/masterAdmin/slotTemplateRoutes.js";

const app = express();
dotenv.config();
// Data understanding middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// 🔹 Create HTTP server
const server = http.createServer(app);

// 🔹 Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // (you can restrict this to your front-end domain later)
    methods: ["GET", "POST"],
  },
});

// Store globally
global.io = io;

// Socket.IO connection logic
io.on("connection", (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // When a delivery person connects, they’ll join their personal room
  socket.on("registerDeliveryPerson", (data) => {
  const deliveryPersonId =
    typeof data === "string" ? data : data.deliveryPersonId;

  if (!deliveryPersonId) {
    console.log("Missing deliveryPersonId in register event");
    return;
  }

  socket.join(`dp_${deliveryPersonId}`);
  console.log(`Delivery person ${deliveryPersonId} joined room dp_${deliveryPersonId}`);
});


  // handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Ensure the functions that are async are properly awaited
const startServer = async () => {
  try {
    await connectDB();
    await createInitialAdmin();
    // console.log("Connected to DB and initialized admin");

    app.get("/", (req, res) => res.send("API Running"));

    // for onBoarding
    app.use("/api/auth", authRoutes);
    app.use("/api/store", storeRoutes);
    app.use("/api/gsm", gsmProductRoutes);

    // for masterAdmin
    app.use("/api/masteradmin", masterAdminAuthRoutes);
    app.use("/api/masterAdminProducts", MasterAdminRoutes);
    app.use("/api/masterAdminPdtCat", MasterAdminptdCatRoutes);
    app.use("/api/masterAdminSlotTemplate", MasterAdminSlotTemplateRoutes);
    //for storeAdmin
    app.use("/api/category", productCategoryRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/subProducts", subProductRoutes);
    app.use("/api/storeDeliveryPerson", storeDeliveryPersonRoutes);
    app.use("/api/order", storeOrderRoutes);
    app.use("/api/slot", storeSlotRoutes);

    // for Fulupo Store
    app.use("/api/auth", storeAuthRoutes);
    app.use("/api/cat", storeCategoryCustomRoutes);
    app.use("/api/purchase", purchaseRoutes);
    app.use("/api/inventory", InventoryRoutes);
    app.use("/api/sales", salesRoutes);
    app.use("/api/wastage", wastageRoutes);
    app.use("/api/profit-loss", profitLossRoutes);
    app.use("/api/summary", summaryRoutes);
    app.use("/api/purchase-return", purchaseReturnRoutes);
    app.use("/api/vendor", vendorRoutes);

    // for grocery
    app.use("/api/grocery", voiceRoutes);

    // for consumer
    app.use("/api/consumer", consumerAuthRoutes);
    app.use("/api/consumer/wishList", wishListRoutes);
    app.use("/api/consumer/cart", cartRoutes);
    app.use("/api/consumer/address", consumerAddressRoutes);
    app.use("/api/consumer/order", orderRoutes);
    app.use("/api/consumer/exchange", replacementRoutes);

    // for delivery person
    app.use("/api/deliveryPerson", deliveryPersonRoutes);

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server + Socket.IO running on http://localhost:${PORT}`);
      console.log("Socket.IO connected and ready!");
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Call startServer to initialize and run the app
startServer();

// middlewares/authMasterAdmin.js
import jwt from "jsonwebtoken";
import Store from "../modules/onBoarding/Store.js";
import MasterAdmin from "../modules/masterAdmin/MasterAdmin.js";

// export const authMasterAdmin = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader)
//     return res.status(401).json({ message: "Authorization header missing" });

//   const token = authHeader.split(" ")[1]; // Bearer <token>
//   if (!token)
//     return res.status(401).json({ message: "Token missing" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Check role
//     if (decoded.role !== "MasterAdmin") {
//       return res.status(403).json({ message: "Access denied: Only Master Admins allowed" });
//     }

//     // Optional: verify MasterAdmin still exists
//     const admin = await MasterAdmin.findById(decoded.adminId);
//     if (!admin) return res.status(401).json({ message: "Master Admin not found" });

//     req.user = decoded; // { adminId, role }
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Invalid or expired token", error: err.message });
//   }
// };


export const authMasterAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await MasterAdmin.findById(decoded.adminId);
    if (!admin) {
      return res.status(403).json({ message: "Access denied: Only Master Admin has access" });
    }

    req.admin = admin; // Attach admin object to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Token invalid", error: err.message });
  }
};


export const authMasterStoreAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔐 Check if it's a MasterAdmin
    if (decoded.adminId) {
      const admin = await MasterAdmin.findById(decoded.adminId);
      if (!admin) {
        return res.status(403).json({ message: "Access denied: Only Master Admin has access" });
      }
      req.admin = admin;
    }

    // 🔐 Check if it's a Store Admin
    else if (decoded.storeId) {
      const store = await Store.findById(decoded.storeId);
      if (!store) {
        return res.status(403).json({ message: "Access denied: Only Store Admin has access" });
      }

      if (!store.isVerified) {
        return res.status(403).json({ message: "Access denied: Store is not verified by admin" });
      }

      req.store = store;
    }

    // ❌ Invalid token structure
    else {
      return res.status(403).json({ message: "Access denied: Invalid token" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Token invalid", error: err.message });
  }
};
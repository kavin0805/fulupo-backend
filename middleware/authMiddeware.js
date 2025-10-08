import jwt from 'jsonwebtoken';
// import Customer from '../modules/Customer.js'
import Store from '../modules/onBoarding/Store.js';

// export const verifyCustomer = async (req, res, next) => {
//   const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

//   if (!token) {
//     return res.status(401).json({ message: "Unauthorized: Token missing" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const customer = await Customer.findById(decoded.id);

//     if (!customer) {
//       return res.status(401).json({ message: "Unauthorized: Invalid token" });
//     }

//     req.customer = customer; // Attach customer to req
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: "Unauthorized: Token invalid", error: err.message });
//   }
// };


export const verifyStoreAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const store = await Store.findById(decoded.storeId); 
    

    if (!store) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    req.store = store; // Attach customer to req
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Token invalid", error: err.message });
  }
};


const verifyOnBoardStoreAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a store admin token (has storeId)
    if (decoded.storeId) {
      const store = await Store.findById(decoded.storeId);
      if (!store) {
        return res.status(401).json({ message: "Unauthorized: Invalid store token" });
      }
      req.store = store;
    }

    // You can handle other roles here if needed
    req.user = decoded; // Attach decoded info (useful for both admin/store)
    next();

  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token", error: err.message });
  }
};

export default verifyOnBoardStoreAdminToken;
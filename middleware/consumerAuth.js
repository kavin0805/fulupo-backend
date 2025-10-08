import Consumer from "../modules/consumer/Consumer.js";
import jwt from "jsonwebtoken";

export const consumerAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find consumer
    const consumer = await Consumer.findById(decoded.id);
    if (!consumer) {
      return res.status(401).json({ message: "Consumer not found" });
    }

    req.consumer = consumer; // attach consumer to request
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};
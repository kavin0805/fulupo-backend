import jwt from "jsonwebtoken";
import DeliveryPerson from "../modules/storeAdmin/deliveryPerson.js";

export const verifyDeliveryPerson = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "DeliveryPerson") {
      return res.status(403).json({ message: "Access denied: not a delivery person" });
    }

    const person = await DeliveryPerson.findById(decoded.id);
    if (!person) {
      return res.status(404).json({ message: "User not found" });
    }

    req.deliveryPerson = person; 
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token", error: err.message });
  }
};

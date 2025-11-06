import jwt from "jsonwebtoken";
import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";

// login delivery person with OTP
export const loginDeliveryPerson = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: "Mobile is required" });

    const person = await DeliveryPerson.findOne({ mobile });
    if (!person) return res.status(404).json({ message: "Delivery person not found" });

    // generate OTP - valid for 5 minutes
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    person.otp = otp;
    person.otpExpiry = expiry;
    await person.save();

    // TODO: integrate SMS provider; for now return mock
    const sent = { mobileNo: mobile, otpNo: otp };

    res.json({ message: "OTP sent successfully", sent });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// verify OTP for delivery person
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ message: "Mobile and OTP are required" });

    const person = await DeliveryPerson.findOne({ mobile });
    if (!person) return res.status(404).json({ message: "Delivery person not found" });

    if (!person.otp || !person.otpExpiry) {
      return res.status(400).json({ message: "No OTP in progress" });
    }
    if (person.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (new Date() > person.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // clear OTP and mark verified
    person.otp = null;
    person.otpExpiry = null;
    if (!person.isVerified) person.isVerified = true;
    await person.save();

    const role = "DeliveryPerson";
    const token = jwt.sign(
      { id: person._id, mobile: person.mobile, role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      message: "Login successful",
      token,
      role,
      data: {
        _id: person._id,
        name: person.name,
        mobile: person.mobile,
        email: person.email,
        assignedStoreIds: person.assignedStoreIds
      }
    });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

// logout delivery person
export const logoutDeliveryPerson = async (_req, res) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ message: "Logout error", error: err.message });
  }
};
// controllers/auth/masterAdminAuth.js
import jwt from "jsonwebtoken";
import sendOtp from "../../utils/sendOtp.js";
import MasterAdmin from '../../modules/masterAdmin/MasterAdmin.js'

export const masterAdminLogin = async (req, res) => {
  const { mobile } = req.body;

  try {
    const admin = await MasterAdmin.findOne({ mobile });

    if (!admin) {
      return res.status(404).json({ message: "Master Admin not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    admin.otp = otp;
    admin.otpExpiry = expiry;
    await admin.save();

    // const sent = await sendOtp(mobile, otp);
    // if (!sent) return res.status(500).json({ message: "Failed to send OTP" });

     const sent = {mobileNo : mobile ,  otpNo : otp};  // await sendOtp(mobile, otp);
    // if (!sent) return res.status(500).json({ message: "Failed to send OTP" });

    res.json({ message: 'OTP sent successfully' , sent });   
    
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

export const verifyMasterAdminOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp)
    return res.status(400).json({ message: "Mobile and OTP are required" });

  try {
    const admin = await MasterAdmin.findOne({ mobile });

    if (!admin) {
      return res.status(404).json({ message: "Master Admin not found" });
    }

    if (admin.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > admin.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    admin.otp = null;
    admin.otpExpiry = null;
    await admin.save();

    // const role = "MasterAdmin";
    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({ message: "Login successful", token, data: admin });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

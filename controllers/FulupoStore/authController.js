import jwt from "jsonwebtoken";
import sendOtp from "../../utils/sendOtp.js";
import Store from "../../modules/onBoarding/Store.js";
// import Employee from "../modules/Employee.js";
// import SidebarMenu from "../modules/SidebarMenu.js";

export const storeLogin = async (req, res) => {
  const { mobile } = req.body;

  try {
    const store = await Store.findOne({ contact_no: mobile });    

    if (!store) {
      return res.status(404).json({ message: 'Mobile number not found' });
    }

    if (!store.isVerified) {
      return res.status(403).json({ message: 'Store is not verified by admin' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);

    store.otp = otp;
    store.otpExpiry = expiry;
    await store.save();

    const sent = {mobileNo : mobile ,  otpNo : otp};  // await sendOtp(mobile, otp);
    // if (!sent) return res.status(500).json({ message: "Failed to send OTP" });

    res.json({ message: 'OTP sent successfully' , sent });   
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};


// OTP Verifier
export const verifyStoreOtp = async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp)
    return res.status(400).json({ message: "Mobile and OTP are required" });

  try {
    const store = await Store.findOne({ contact_no: mobile });
    let role = "StoreAdmin";
    

    if (!store) { 
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.otp !== otp ) { //!== otp
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > store.otpExpiry) {          
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Clear OTP (optional)
    store.otp = null;
    store.otpExpiry = null;
    await store.save();

    // Optionally generate JWT token here

    const token = jwt.sign({ storeId: store._id  , role}, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ message: 'Login successful', token, role , data : store });

  } catch (err) {
    res.status(500).json({ message: 'OTP verification failed', error: err.message });
  }
};


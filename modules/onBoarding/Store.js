import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  store_name: {require : true , type: String},
  store_owner_name: {require : true , type: String},
  store_category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreCategory'
  },
  store_unique_id: { type: String, required: true, unique: true },
  contact_no: {require : true , type: String},
  landline_no: String,
  store_address: {require : true , type: String},
  store_area: {require : true , type: String},
  store_district: {require : true , type: String},
  store_state: {require : true , type: String},
  lat: {require : true , type: String},
  long: {require : true , type: String},
  geolation: {require : true , type: String},
  eta_date: {require : true , type: String},
  store_logo: String,
  store_image: {
  type: [String],  
  required: true,
  validate: [(val) => val.length > 0, "At least one image is required"]
},
  kyc_gst_number: {require : true , type: String},
  store_licence: {
  type: [String],  
  required: true,
  validate: [(val) => val.length > 0, "At least one image is required"]
},
  owner_kyc_details: {
  type: [String],  
  required: true,
  validate: [(val) => val.length > 0, "At least one image is required"]
},
 fulupoSoft: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FulupoSoft' // ← this should match the model name you used in FulupoSoft model
}],

// ✅ New Fields
  bank_account_number: { type: String},  //, required: true
  bank_ifsc_code: { type: String }, //, required: true
  bank_holder_name: { type: String},  //, required: true
  pay_mode: {
    type: [String], // multiple checkboxes
    enum: ["bill_value", "monthly_rent"], // restrict to these two
    required: true
  },
bill_value_percentage: {
    type: Number,
    required: function () {
      return this.pay_mode === "bill_value";
    },
  },
  rent_amount: {
    type: Number,
    required: function () {
      return this.pay_mode === "monthly_rent";
    },
  },

createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User', // or 'MasterAdmin' or 'Employee', based on your system
  required: true
},
updatedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
role:String,
isVerified: { type: Boolean, default: false },
otp: String,
otpExpiry: Date
});

export default mongoose.model('Store', storeSchema);

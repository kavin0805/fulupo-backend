import mongoose from 'mongoose';

const gsmProductSchema = new mongoose.Schema({
  productCode: {  type: String,  required: true  },
  name: { type: String, required: true },
  dimenstionImages: { type: [String] , required : true}, // store image filename or URL
  masterProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProducts', required: true },
  // purchasePrice:{ type: String  , required : true} ,
  // mrpPrice: { type: Number , required : true },
  // discountPrice: { type: Number},
  netQty:{ type : String },
  // purchasePrice: { type: Number },
  // showAvlQty: { type: Number, default: 0 },
  height:{type : String},
  width:{type : String},
  length:{type : String},
  createdBy: {
  id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String
},
  createdAt: { type: Date, default: Date.now }, 
});




export default mongoose.model('GSMProduct', gsmProductSchema);

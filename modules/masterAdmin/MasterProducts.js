// models/MasterProduct.js
import mongoose from 'mongoose';

const MasterProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCode: { type: String, unique: true , required : true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterProductCategory' , required : true},
  productImage: String,
    //   basePrice: Number,
  description: String
}, { timestamps: true });

export default mongoose.model('MasterProducts', MasterProductSchema);

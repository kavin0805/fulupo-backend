import mongoose from 'mongoose';

const fulupoSoftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  version: String,
});

export default mongoose.model('FulupoSoft', fulupoSoftSchema);

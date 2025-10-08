import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile_number: { type: String, required: true },
  password: { type: String, required: true },
});

export default mongoose.model('User', userSchema);

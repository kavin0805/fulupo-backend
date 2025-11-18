import mongoose from "mongoose";
import dayjs from "dayjs";

const employeeSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },
    employeeCode: { type: String, unique: true, index: true }, // EMP001...
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    dob: { type: Date },
    age: { type: Number },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    address: { type: String },
    employeeType: { type: String, required: true },
    salary: { type: Number, required: true },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Auto-calc age before save
employeeSchema.pre("save", function (next) {
  if (this.dob) {
    this.age = dayjs().diff(dayjs(this.dob), "years");
  }
  next();
});

export default mongoose.model("employee", employeeSchema);

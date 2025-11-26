import StoreEmployee from "../../modules/storeAdmin/employee.js";
import dayjs from "dayjs";

// Generate employee code
const generateEmployeeCode = async (storeId) => {
  const lastEmp = await StoreEmployee
    .findOne({ storeId })
    .sort({ createdAt: -1 });

  if (!lastEmp || !lastEmp.employeeCode) return "EMP001";

  const lastNumber = parseInt(lastEmp.employeeCode.replace("EMP", "")) || 0;
  const nextNumber = (lastNumber + 1).toString().padStart(3, "0");

  return `EMP${nextNumber}`;
};

// Create new employee
export const addEmployee = async (req, res) => {
  try {
    const storeId = req.store._id;

    const {
      name,
      phone,
      email,
      salary,
      dob,
      gender,
      address,
      employeeType,
      joinDate,
    } = req.body;

    if (!name || !phone || !salary || !employeeType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const employeeCode = await generateEmployeeCode(storeId);

    const emp = await StoreEmployee.create({
      storeId,
      name,
      phone,
      email,
      salary,
      dob,
      gender,
      address,
      employeeType,
      joinDate,
      employeeCode,
    });

    res.json({ message: "Employee added successfully", employee: emp });
  } catch (err) {
    res.status(500).json({ message: "Error adding employee", error: err.message });
  }
};

// Get all employees
export const getEmployees = async (req, res) => {
  try {
    const storeId = req.store._id;

    const employees = await StoreEmployee
      .find({ storeId })
      .sort({ createdAt: -1 });

    res.json({ count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ message: "Error fetching employees", error: err.message });
  }
};

// Get single employee
export const getEmployee = async (req, res) => {
  try {
    const storeId = req.store._id;

    const emp = await StoreEmployee.findOne({
      _id: req.params.id,
      storeId,
    });

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Error fetching employee", error: err.message });
  }
};

// Update employee
export const updateEmployee = async (req, res) => {
  try {
    const storeId = req.store._id;

    const emp = await StoreEmployee.findOneAndUpdate(
      { _id: req.params.id, storeId },
      req.body,
      { new: true }
    );

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee updated successfully", employee: emp });
  } catch (err) {
    res.status(500).json({ message: "Update error", error: err.message });
  }
};

// HARD DELETE employee
export const deleteEmployee = async (req, res) => {
  try {
    const storeId = req.store._id;

    const emp = await StoreEmployee.findOneAndDelete({
      _id: req.params.id,
      storeId,
    });

    if (!emp) return res.status(404).json({ message: "Employee not found" });

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete error", error: err.message });
  }
};

// Search (name/phone/code)
export const searchEmployee = async (req, res) => {
  try {
    const storeId = req.store._id;
    const { query } = req.query;

    const employees = await StoreEmployee.find({
      storeId,
      $or: [
        { name: new RegExp(query, "i") },
        { phone: new RegExp(query, "i") },
        { employeeCode: new RegExp(query, "i") },
      ],
    });

    res.json({ count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ message: "Search error", error: err.message });
  }
};

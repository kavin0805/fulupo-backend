import GSMProduct from "../../modules/onBoarding/GSMProduct.js";

export const addGSMProduct = async (req, res) => {
  try {
    const {
      name, productCode, masterProductId, netQty, height, width, length
    } = req.body;

    const dimenstionImages = req.files?.map(file => file.path) || [];

    if (!name || !masterProductId || dimenstionImages.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ❌ Check if already exists for this masterProductId
    const existing = await GSMProduct.findOne({ masterProductId });
    if (existing) {
      return res.status(400).json({ message: 'GSM Product already exists for this Master Product' });
    }

    const newProduct = new GSMProduct({
      name,
      productCode,
      masterProductId,
      dimenstionImages,
      netQty,
      height,
      width,
      length,
      createdBy: {
        id: req.user._id,
        name: req.user.name
      }
    });

    await newProduct.save();
    res.status(201).json({ message: 'GSM Product added successfully', data: newProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error adding GSM Product', error: err.message });
  }
};


// ✅ Get all GSM Products
export const getAllGSMProducts = async (req, res) => {
  try {
    const products = await GSMProduct.find()
      .populate("masterProductId", "name productCode")
      .sort({ createdAt: -1 });

    res.json({ count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching GSM Products", error: err.message });
  }
};

// ✅ Get GSM Product by ID
export const getGSMProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await GSMProduct.findById(id)
      .populate("masterProductId", "name productCode");

    if (!product) return res.status(404).json({ message: "GSM Product not found" });

    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ message: "Error fetching GSM Product", error: err.message });
  }
};

// ✅ Get GSM Product by masterProductId
export const getGSMProductByMasterProductId = async (req, res) => {
  try {
    const { masterProductId } = req.params;
    const product = await GSMProduct.findOne({ masterProductId })
      .populate("masterProductId", "name productCode");

    if (!product) return res.status(404).json({ message: "GSM Product not found for this masterProductId" });

    res.json({ data: product });
  } catch (err) {
    res.status(500).json({ message: "Error fetching GSM Product", error: err.message });
  }
};

// ✅ Get GSM Products by created user
export const getGSMProductsByUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const products = await GSMProduct.find({ 'createdBy.id': userId })
      .populate("masterProductId", "name productCode")
      .sort({ createdAt: -1 });

    res.json({ count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching GSM Products by user", error: err.message });
  }
};

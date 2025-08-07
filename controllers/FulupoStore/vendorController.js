import Purchase from "../../modules/FulupoStore/Purchase.js";

export const addVendor = async (req, res) => {
  try {
    const {
      storeId,
      vendorName,
      vendorGst,
      vendorMobile,
      vendorLandline,
      vendorAddress,
    } = req.body;

    if (!storeId || !vendorName) {
      return res
        .status(400)
        .json({ message: "Store ID and Vendor Name are required" });
    }

    // Check if vendor already exists
    // const existingVendor = await Vendor.findOne({ storeId, vendorName: { $regex: new RegExp(`^${vendorName}$`, 'i') } });

    const allVendor = await Vendor.find({ storeId });

    const existingVendor = allVendor.find(
      (ven) =>
        ven.vendorName.trim().toLowerCase() === vendorName.trim().toLowerCase()
    );

    if (existingVendor) {
      return res.status(400).json({ message: "Vendor already exists" });
    }

    const newVendor = new Vendor({
      storeId,
      vendorName,
      vendorGst,
      vendorMobile,
      vendorLandline,
      vendorAddress,
    });

    await newVendor.save();

    res
      .status(201)
      .json({ message: "Vendor added successfully", data: newVendor });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error adding vendor", error: err.message });
  }
};

// GET /api/vendor/list
export const getVendorList = async (req, res) => {
  try {
    const { storeId } = req.body;

    const vendors = await Purchase.distinct("vendorName", { storeId });

    res.json({ count: vendors.length, vendors });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching vendors", error: err.message });
  }
};

// POST /api/vendor/by-id
export const getPurchasesByVendorName = async (req, res) => {
  try {
    const { storeId, vendorName } = req.body;

    if (!storeId || !vendorName)
      return res
        .status(400)
        .json({ message: "storeId and vendorName are required" });

    const data = await Purchase.find({ storeId, vendorName }).populate(
      "product.product_id",
      "name productImage productCode"
    );

    res.json({ count: data.length, data });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching vendor purchases", error: err.message });
  }
};

// POST /api/vendor/by-product
export const getVendorsByProductId = async (req, res) => {
  try {
    const { storeId, productId } = req.body;

    if (!storeId || !productId)
      return res
        .status(400)
        .json({ message: "storeId and productId are required" });

    const vendors = await Purchase.aggregate([
      {
        $match: {
          storeId: new mongoose.Types.ObjectId(storeId),
          "product.product_id": new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: "$vendorName",
        },
      },
    ]);

    res.json({ count: vendors.length, vendors: vendors.map((v) => v._id) });
  } catch (err) {
    res.status(500).json({
      message: "Error fetching vendors by product",
      error: err.message,
    });
  }
};

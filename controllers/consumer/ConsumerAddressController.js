import ConsumerAddress from "../../modules/consumer/ConsumerAddress.js";

// ➕ Add new address
export const addAddress = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { name, mobile, addressName , addressLine , addressType, isDefault } = req.body;

    if (!name || !mobile || !addressLine ) {
      return res.status(400).json({ message: "Missing required address fields" });
    }

    if (isDefault) {
      await ConsumerAddress.updateMany({ consumerId }, { isDefault: false });
    }

    const address = await ConsumerAddress.create({
      consumerId,
      name,
      addressName,
      mobile,
      addressLine, 
      addressType,
      isDefault: !!isDefault,
    });

    res.json({ message: "Address added successfully", address });
  } catch (err) {
    res.status(500).json({ message: "Error adding address", error: err.message });
  }
};

// ✏️ Update existing address
export const updateAddress = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { addressId } = req.params;
    const updateData = req.body;

    const address = await ConsumerAddress.findOne({ _id: addressId, consumerId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (updateData.isDefault) {
      await ConsumerAddress.updateMany({ consumerId }, { isDefault: false });
    }

    Object.assign(address, updateData);
    await address.save();

    res.json({ message: "Address updated successfully", address });
  } catch (err) {
    res.status(500).json({ message: "Error updating address", error: err.message });
  }
};

// ❌ Delete address
export const deleteAddress = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const { addressId } = req.body;

    const address = await ConsumerAddress.findOneAndDelete({ _id: addressId, consumerId });
    if (!address) return res.status(404).json({ message: "Address not found" });

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting address", error: err.message });
  }
};


// 📦 Get all addresses
export const getAddresses = async (req, res) => {
  try {
    const consumerId = req.consumer._id;
    const addresses = await ConsumerAddress.find({ consumerId }).sort({ isDefault: -1, updatedAt: -1 });

    res.json({ count: addresses.length, addresses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching addresses", error: err.message });
  }
};

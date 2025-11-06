import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";

// Get my profile
export const getMyProfile = async (req, res) => {
    try {
      const me = await DeliveryPerson.findById(req.deliveryPerson._id);
      if (!me) return res.status(404).json({ message: "Profile not found" });
      res.json(me);
    } catch (err) {
      res.status(500).json({ message: "Error fetching profile", error: err.message });
    }
  };
  
  // Update my profile
  // Update my profile (Delivery Person)
export const updateMyProfile = async (req, res) => {
  try {
    const allowed = [
      "profileImage",
      "vehicleNumber", "vehiclePhoto", "rcNumber", "rcImage", "insuranceNumber", "insuranceImage",
      "aadharNumber", "aadharImage", "drivingLicenseNumber", "drivingLicenseImage",
      "otherDocuments",
      "bankName", "accountNumber", "ifscCode", "branch", "passbookImage"
    ];

    const update = {};

    // Handle text fields
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        update[field] = req.body[field];
      }
    }

    // Handle file uploads using multer
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        update[key] = req.files[key][0].path; // storing the file path
      });
    }

    // Update delivery person's data
    const updated = await DeliveryPerson.findByIdAndUpdate(
      req.deliveryPerson._id,
      update,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({ message: "Profile updated successfully", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
};

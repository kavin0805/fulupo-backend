import DeliveryPerson from "../../modules/storeAdmin/deliveryPerson.js";

//add new delivery person by store ID by store admin
export const createDeliveryPersonByStore = async (req, res) => {
  try {
    const { name, mobile, email, storeId } = req.body;

    if (!name || !mobile || !email || !storeId) {
      return res
        .status(400)
        .json({ message: "name, mobile, email, and storeId are required" });
    }

    // Uniqueness by mobile/email
    const existing = await DeliveryPerson.findOne({
      $or: [{ mobile }, { email }],
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Mobile or email already exists" });
    }

    const person = await DeliveryPerson.create({
      name,
      mobile,
      email,
      storeId,
      status: "Active",
      isAvailable: true,
      isVerified: false,
    });

    res.status(201).json({ message: "Delivery person created", data: person });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating delivery person", error: err.message });
  }
};

// List delivery persons by store ID by store admin
export const getDeliveryPersonsByStore = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId)
      return res.status(400).json({ message: "storeId is required" });

    const persons = await DeliveryPerson.find({ storeId: storeId }).sort({
      createdAt: -1,
    });
    res.json({ count: persons.length, data: persons });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error listing delivery persons", error: err.message });
  }
};

// Get delivery person by ID -store admin access
export const getDeliveryPersonByStoreAndId = async (req, res) => {
  try {
    const { storeId, personId } = req.query;

    if (!storeId || !personId) {
      return res
        .status(400)
        .json({ message: "storeId and personId are required" });
    }

    const person = await DeliveryPerson.findOne({
      _id: personId,
      storeId: storeId,
    });

    if (!person) {
      return res
        .status(404)
        .json({ message: "Delivery person not found for this store" });
    }

    res.json({ data: person });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching delivery person", error: err.message });
  }
};

// Delete delivery person by ID - store admin access
export const deleteDeliveryPersonByStoreAndId = async (req, res) => {
  try {
    const { storeId, personId } = req.query;

    if (!storeId || !personId) {
      return res
        .status(400)
        .json({ message: "storeId and personId are required" });
    }

    const deleted = await DeliveryPerson.findOneAndDelete({
      _id: personId,
      storeId: storeId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Delivery person not found for this store" });
    }

    res.json({ message: "Delivery person deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting delivery person", error: err.message });
  }
};

// Search Delivery Person by Store Admin
export const searchDeliveryPersonsByStore = async (req, res) => {
  try {
    const { storeId, query } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: "storeId is required" });
    }

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i"); // case-insensitive search

    const persons = await DeliveryPerson.find({
      storeId,
      $or: [
        { name: regex },
        { mobile: regex },
        { email: regex },
      ],
    }).sort({ createdAt: -1 });

    res.json({
      count: persons.length,
      data: persons,
    });

  } catch (err) {
    res.status(500).json({
      message: "Error searching delivery persons",
      error: err.message,
    });
  }
};

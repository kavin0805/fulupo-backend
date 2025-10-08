import { getDistrictsByStateCode, getStatesOfIndia } from '../../services/locationService.js';
import Store from '../../modules/onBoarding/Store.js';
import StoreCategory from '../../modules/onBoarding/StoreCategory.js';

// Replace your getStates with this:
export const getStates = async (req, res) => {
  try {
    const states = await getStatesOfIndia();
    res.json(states);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching states', error: err.message });
  }
};

// Replace getDistrictsByState with this (requires ISO code like TN, KA, etc.)
export const getDistrictsByState = async (req, res) => {
  try {
    const { stateCode } = req.params;
    const districts = await getDistrictsByStateCode(stateCode);
    res.json(districts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching districts', error: err.message });
  }
};


const generateUniqueStoreId = async (prefix) => {
  let uniqueId;
  let exists = true;

  while (exists) {
    const randomNum = Math.floor(100 + Math.random() * 900); // random 3-digit
    uniqueId = `${prefix}${randomNum}`;
    const existing = await Store.findOne({ store_unique_id: uniqueId });
    if (!existing) exists = false;
  }

  return uniqueId;
};

export const addStore = async (req, res) => {
  try {
    const files = req.files;

    // Check if all required files are uploaded
    const requiredFiles = ['store_image', 'store_licence', 'owner_kyc_details'];
    for (const field of requiredFiles) {
      if (!files[field] || !files[field][0]) {
        return res.status(400).json({ message: `Missing required file: ${field}` });
      }
    }

    console.log("req.user" , req.user);
    

    const storeName = req.body.store_name || '';
    if (!storeName || storeName.length < 2) {
      return res.status(400).json({ message: 'Store name is too short to generate ID' });
    }

    // Generate store_unique_id
    const prefix = storeName.substring(0, 2).toUpperCase();
    const store_unique_id = await generateUniqueStoreId(prefix);

    const store = new Store({
      ...req.body,
      store_unique_id,
      createdBy: req.user._id,
      store_logo: files.store_logo[0].path,
      store_image: files.store_image.map(img => img.path),
      store_licence: files.store_licence.map(img => img.path),
      owner_kyc_details: files.owner_kyc_details.map(img => img.path),
    });    

    await store.save();
    res.status(201).json({ message: 'Store added successfully', store });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding store', error: err.message });
  }
};

export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find()
      .populate('store_category_id', 'name')
      .populate('fulupoSoft', 'name')
      .populate('createdBy', 'username name mobile_number') // 👈 Add this line
      .populate('updatedBy', 'username name mobile_number');      
      
    res.json({ data: stores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching stores', error: err.message });
  }
};


export const getStoreList = async (req, res) => {
  try {
    const stores = await Store.find({}, '_id store_name'); // only select _id and name
    res.json({ data: stores });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching store list', error: err.message });
  }
};

// Get Store by ID
export const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate('store_category_id', 'name')
      .populate('fulupoSoft', 'name')
      .populate('createdBy', 'username name mobile_number')
      .populate('updatedBy', 'username name mobile_number'); 

    if (store) {
      res.json({ data: store });
    } else {
      res.status(404).json({ message: 'Store not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error fetching store by ID', error: err.message });
  }
};

// Get Stores by Category ID
export const getStoresByCategoryId = async (req, res) => {
  try {
    const stores = await Store.find({ store_category_id: req.params.categoryId })
      .populate('store_category_id', 'name')
      .populate('fulupoSoft', 'name')
      .populate('createdBy', 'username name mobile_number')
      .populate('updatedBy', 'username name mobile_number'); 

    res.json({ data: stores });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stores by category', error: err.message });
  }
};


export const updateStore = async (req, res) => {
  try {
    const files = req.files;
    const storeId = req.params.id;

    const updateData = {
      ...req.body,
      updatedBy: req.user._id,
    };


    // Handle optional uploaded files — same fields as in addStore
    if (files?.store_logo?.[0]) {
      updateData.store_logo = files.store_logo[0].path;
    }

    if (files?.store_image?.length) {
      updateData.store_image = files.store_image.map((img) => img.path);
    }

    if (files?.store_licence?.length) {
      updateData.store_licence = files.store_licence.map((img) => img.path);
    }

    if (files?.owner_kyc_details?.length) {
      updateData.owner_kyc_details = files.owner_kyc_details.map((img) => img.path);
    }

    const store = await Store.findByIdAndUpdate(storeId, updateData, { new: true });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    res.json({ message: "Store updated successfully", store });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Error updating store", error: err.message });
  }
};



export const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.json({ message: 'Store deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Error deleting store', error: err.message });
  }
};

import Store from "../modules/onBoarding/Store.js";

export const checkStoreVerified = async (req, res, next) => {
  try {
    const storeId = req.body ? req.body.storeId : req.store._id;

    const store = await Store.findById(storeId); // `storeId` from decoded JWT //req.user.storeId

    if (!store || !store.isVerified) {
      return res
        .status(401)
        .json({
          message: "Your store is not verified or has been disabled by admin.",
        });
    }

    next();
  } catch (err) {
    res
      .status(500)
      .json({ message: "Store verification failed", error: err.message });
  }
};

import DeliverySlotTemplate from '../../modules/masterAdmin/deliverySlotTemplate.js';


export const getActiveTemplate = async (req, res) => {
  try {
    const tpl = await DeliverySlotTemplate.findOne({ isActive: true });
    if (!tpl) return res.status(404).json({ message: "No active template" });
    res.json({ data: tpl });
  } catch (e) {
    res.status(500).json({ message: "Template fetch error", error: e.message });
  }
};


export const upsertTemplate = async (req, res) => {
  try {
    const { startTime = "06:00", endTime = "23:00", durationMins = 60, isActive = true } = req.body;
    const tpl = await DeliverySlotTemplate.findOneAndUpdate(
      {},
      { startTime, endTime, durationMins, isActive },
      { new: true, upsert: true }
    );
    res.json({ message: "Template saved", data: tpl });
  } catch (e) {
    res.status(500).json({ message: "Template error", error: e.message });
  }
};


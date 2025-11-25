import deliverySlotTemplate from "../../modules/masterAdmin/deliverySlotTemplate.js";
import storeDeliverySlot from "../../modules/storeAdmin/storeDeliverySlot.js";
import { generateHourlyRanges } from "../../utils/slotUtils.js";
import { computeSlotCapacity } from "../../utils/capacity.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
dayjs.extend(utc);
dayjs.extend(timezone);

// publish the slots
export const publishSlotsForDate = async (req, res) => {
  try {
    const { storeId } = req.body;
    if (!storeId)
      return res.status(400).json({ message: "storeId is required" });

    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    const tpl = await deliverySlotTemplate.findOne({ isActive: true });
    if (!tpl) return res.status(400).json({ message: "No active template" });

    const capacity = await computeSlotCapacity(storeId);
    const ranges = generateHourlyRanges(
      tpl.startTime,
      tpl.endTime,
      tpl.durationMins
    );

    const ops = ranges.map((r) => ({
      updateOne: {
        filter: { storeId, date, start: r.start },
        update: {
          $setOnInsert: {
            storeId,
            date,
            start: r.start,
            end: r.end,
            capacity,
            bookedCount: 0,
            isActive: true,
          },
        },
        upsert: true,
      },
    }));
    if (ops.length) await storeDeliverySlot.bulkWrite(ops);

    const slots = await storeDeliverySlot
      .find({ storeId, date })
      .sort({ start: 1 });
    res.json({ message: "Slots published", count: slots.length, Slots: slots });
  } catch (e) {
    res.status(500).json({ message: "Publish error", error: e.message });
  }
};

// Create a single slot
export const createSlot = async (req, res) => {
  try {
    const { storeId, start, end, capacity } = req.body;
    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    if (!storeId || !start || !end || capacity === undefined)
      return res
        .status(400)
        .json({ message: "storeId, start, end, capacity are required" });

    const slot = await storeDeliverySlot.create({
      storeId,
      date,
      start,
      end,
      capacity,
      bookedCount: 0,
      isActive: true,
    });

    res.status(201).json({ message: "Slot created", Slot: slot });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Slot already exists for this time" });
    res.status(500).json({ message: "Create slot error", error: e.message });
  }
};

// Bulk create slots
export const bulkCreateSlots = async (req, res) => {
  try {
    const { storeId, slots, overwrite = false } = req.body;
    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    if (!storeId || !Array.isArray(slots) || !slots.length)
      return res
        .status(400)
        .json({ message: "storeId and slots[] are required" });

    // Auto calculate capacity based on number of delivery partners
    const autoCapacity = await computeSlotCapacity(storeId);

    // Normalize inputs, ignore capacity if user sends it
    const incoming = slots.map((s) => ({
      start: String(s.start).trim(),
      end: String(s.end).trim(),
    }));

    // fetch existing for the given day
    const existing = await storeDeliverySlot
      .find({
        storeId,
        date,
        start: { $in: incoming.map((s) => s.start) },
      })
      .select("_id start end capacity isActive")
      .lean();

    const existingByStart = new Map(existing.map((e) => [e.start, e]));

    const toInsert = [];
    const toUpdateOps = [];
    const duplicates = [];

    for (const s of incoming) {
      const found = existingByStart.get(s.start);

      if (!found) {
        // Create new slot with auto capacity
        toInsert.push({
          storeId,
          date,
          start: s.start,
          end: s.end,
          capacity: autoCapacity,
          bookedCount: 0,
          isActive: true,
        });
      } else {
        duplicates.push(s.start);

        if (overwrite) {
          const updateDoc = {};

          // allow time update
          if (s.end && s.end !== found.end) updateDoc.end = s.end;

          // always override capacity with auto capacity
          updateDoc.capacity = autoCapacity;

          if (Object.keys(updateDoc).length) {
            toUpdateOps.push({
              updateOne: {
                filter: { _id: found._id },
                update: { $set: updateDoc },
              },
            });
          }
        }
      }
    }

    const results = {
      createdCount: 0,
      updatedCount: 0,
      skippedDuplicates: duplicates,
    };

    if (toInsert.length) {
      const created = await storeDeliverySlot.insertMany(toInsert, {
        ordered: false,
      });
      results.createdCount = created.length;
    }

    if (toUpdateOps.length) {
      const updRes = await storeDeliverySlot.bulkWrite(toUpdateOps, {
        ordered: false,
      });
      results.updatedCount = updRes.modifiedCount || 0;
    }

    const Slots = await storeDeliverySlot
      .find({ storeId, date })
      .sort({ start: 1 });

    res.json({
      message: "Bulk slots processed",
      summary: results,
      Slots,
    });
  } catch (e) {
    res.status(500).json({ message: "Bulk create error", error: e.message });
  }
};

// List slots for a day
export const listSlots = async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId)
      return res.status(400).json({ message: "storeId is required" });

    const date = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");

    const slots = await storeDeliverySlot
      .find({ storeId, date })
      .sort({ start: 1 });
    res.json({ count: slots.length, slots });
  } catch (e) {
    res.status(500).json({ message: "List error", error: e.message });
  }
};

// Update a slot
export const updateSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { start, end, capacity, isActive } = req.body;

    const updated = await storeDeliverySlot.findByIdAndUpdate(
      slotId,
      {
        $set: {
          ...(start && { start }),
          ...(end && { end }),
          ...(capacity !== undefined && { capacity }),
          ...(isActive !== undefined && { isActive }),
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Slot not found" });
    res.json({ message: "Slot updated", data: updated });
  } catch (e) {
    res.status(500).json({ message: "Update error", error: e.message });
  }
};

// Delete a slot
export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const deleted = await storeDeliverySlot.findByIdAndDelete(slotId);
    if (!deleted) return res.status(404).json({ message: "Slot not found" });
    res.json({ message: "Slot deleted" });
  } catch (e) {
    res.status(500).json({ message: "Delete error", error: e.message });
  }
};

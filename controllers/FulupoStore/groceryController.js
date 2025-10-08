import GroceryProcessor from "../services/groceryProcessor.js";

export const importGroceryExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const processor = new GroceryProcessor();
    const result = await processor.processExcel(file.path);

    res.status(200).json({
      message: "Grocery data processed successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error in importGroceryExcel:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

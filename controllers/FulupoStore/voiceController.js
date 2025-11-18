import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import mime from "mime-types";
import dotenv from 'dotenv'

dotenv.config();

class GroqAPIError extends Error {}

class GroceryItem {
  constructor({ product, weight = null, amount = null, pocket = null, piece = null, liter = null }) {
    this.product = product;
    this.weight = weight;
    this.amount = amount;
    this.pocket = pocket;
    this.piece = piece;
    this.liter = liter;
  }
}

console.log("process.env.GROQ_API_KEY " , process.env.GROQ_API_KEY );


class GroceryProcessor {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY ;
    if (!this.apiKey) throw new Error("GROQ API key must be provided.");

    this.transcribeUrl = "https://api.groq.com/openai/v1/audio/translations";
    this.chatUrl = "https://api.groq.com/openai/v1/chat/completions";
    this.modelName = "llama-3.3-70b-versatile";
    this.supportedFormats = new Set([".wav", ".mp3", ".m4a", ".flac", ".ogg" , ".mp4"]);
  }

  validateAudioFile(filePath, originalFileName) {
    if (!fs.existsSync(filePath)) throw new Error(`Audio file not found: ${filePath}`);
    const ext = path.extname(originalFileName).toLowerCase();
    if (!this.supportedFormats.has(ext)) throw new Error(`Unsupported format: ${ext}`);
    return filePath;
  }

  async transcribeAudio(audioFilePath, originalFileName) {
    const filePath = this.validateAudioFile(audioFilePath, originalFileName);
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
      filename: path.basename(originalFileName),
      contentType: mime.lookup(originalFileName) || 'application/octet-stream'
    });
    form.append("model", "whisper-large-v3");

    try {
      const response = await axios.post(this.transcribeUrl, form, {
        headers: { ...form.getHeaders(), Authorization: `Bearer ${this.apiKey}` },
        timeout: 30000
      });
      const text = response.data.text?.trim();
      if (!text) throw new GroqAPIError("No text returned from audio");
      return text;
    } catch (err) {
      throw new GroqAPIError(`Transcription failed: ${err.message}`);
    }
  }

  createExtractionPrompt(text) {
    return `
You are a smart information extractor. Convert the following Tamil/English grocery purchase text into structured JSON.

The text may contain multiple grocery products. For each product, extract:
- product: English product name
- weight: If "kg", "g", "gram", etc. is mentioned (e.g. "500g", "1 kg"), else null
- amount: If "rupees", "rs", "₹", or price is mentioned (e.g. "50 rupees"), extract the full amount with currency (e.g. "50 rupees")
- pocket: If "packet", "pack", or "pocket" is mentioned (e.g. "1 packet"), else null
- piece: If number of pieces mentioned (e.g. "2 pieces", "5 pcs"), else null
- liter: If liquid quantity mentioned (e.g. "1 litre", "500 ml"), else null

IMPORTANT:
1. Always extract the amount/price when mentioned
2. The amount should include both the number and currency (e.g. "50 rupees")
3. Return *only JSON*, no explanations or markdown.

Examples:
Input: "2 packets of turmeric powder 100g each for 30 rupees, 1 kg rice for 60 rupees"
Output:
{
  "products": [
    {
      "product": "Turmeric Powder",
      "weight": "100g",
      "amount": "30 rupees",
      "pocket": "2",
      "piece": null,
      "liter": null
    },
    {
      "product": "Rice",
      "weight": "1 kg",
      "amount": "60 rupees",
      "pocket": null,
      "piece": null,
      "liter": null
    }
  ]
}

Input: "${text}"
Output:
`;
  }

  async extractGroceryInfo(text) {
    const prompt = this.createExtractionPrompt(text);
    const data = {
      model: this.modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 1000
    };

    try {
      const response = await axios.post(this.chatUrl, data, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      });

      const content = response.data.choices?.[0]?.message?.content;
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new GroqAPIError("No valid JSON object found in API response");

      const cleaned = match[0].replace(/\n/g, '').replace(/,\s*\}/g, '}');
      const result = JSON.parse(cleaned);

      const items = (result.products || []).map(item => new GroceryItem(item));
      return items;
    } catch (err) {
      throw new GroqAPIError(`Information extraction failed: ${err.message}`);
    }
  }

  calculateTotalAmount(items) {
    let total = 0;
    let count = 0;
    for (const item of items) {
      if (item.amount) {
        const clean = item.amount.replace(/₹|rupees|rs|,/gi, '').trim();
        const match = clean.match(/[\d\.]+/);
        if (match) {
          total += parseFloat(match[0]);
          count++;
        }
      }
    }
    return count > 0 ? total : null;
  }

  simplifyOutput(items) {
    return items.map(item => {
      // const parts = [item.product?.trim()];
      // if (item.weight) parts.push(item.weight.trim());
      // else if (item.liter) parts.push(item.liter.trim());
      const parts = [item.product];

      console.log("item" , item);
      

      return {
        product: parts.join(" "),
        netQty : item.weight ? item.weight : item.liter,
        pocket: item.pocket
      };
    });
  }

  async processGroceryOrder(audioFilePath, originalFileName) {
    const text = await this.transcribeAudio(audioFilePath, originalFileName);
    const items = await this.extractGroceryInfo(text);
    const total = this.calculateTotalAmount(items);
    const simplified = this.simplifyOutput(items);
    return {
      transcribed_text: text,
      grocery_items: simplified,
      total_items: items.length,
      total_amount: total
    };
  }
}



export const voiceController =  async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No audio file provided' });
  }

  const processor = new GroceryProcessor();
  const filePath = req.file.path;
  const originalFileName = req.file.originalname;

  try {
    const result = await processor.processGroceryOrder(filePath, originalFileName);
    fs.unlinkSync(filePath); 
    res.json({
      success: true,
      data: {
        transcribed_text: result.transcribed_text,
        grocery_items: result.grocery_items,
        total_items: result.total_items,
        total_amount: result.total_amount !== null ? `₹${result.total_amount.toFixed(2)}` : 'Not available'
      }
    });
  } catch (err) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); 
    }
    console.error(`Error processing file: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};



export const findProducts = async (req, res) => {
  try {
    const { grocery_items, storeId } = req.body;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Store ID is required"
      });
    }

    if (!grocery_items || grocery_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No grocery items provided"
      });
    }

    const productNames = grocery_items.map(item => item.product.trim().toLowerCase());

    // 🔹 Query by storeId + product name
    const productsFromDb = await Product.find({
      storeId: storeId, // filter for store
      name: { $in: grocery_items.map(item => item.product) }
    });

    console.log("productsFromDb", productsFromDb);

    const matched = [];
    const unmatched = [];

    let totalAmount = 0;
    let totalGstAmount = 0;

    grocery_items.forEach(item => {
      const dbProduct = productsFromDb.find(
        p => p.name.trim().toLowerCase() === item.product.trim().toLowerCase()
      );

      if (dbProduct) {
        const pockets = Number(item.pockets) || 1;
        const unitPrice = dbProduct.discountPrice || dbProduct.mrpPrice;
        const totalPrice = unitPrice * pockets;
        const gstAmount = (totalPrice * dbProduct.product_gst_percent) / 100;

        totalAmount += totalPrice;
        totalGstAmount += gstAmount;

        matched.push({
          _id: dbProduct._id,
          name: dbProduct.name,
          productCode: dbProduct.productCode,
          mrpPrice: dbProduct.mrpPrice,
          discountPrice: dbProduct.discountPrice,
          gstPercentage: dbProduct.product_gst_percent,
          pockets,
          unitPrice,
          totalPrice,
          gstAmount
        });
      } else {
        unmatched.push(item.product);
      }
    });

    const totalGstPercentage = totalAmount
      ? (totalGstAmount / totalAmount) * 100
      : 0;

    res.json({
      success: true,
      matched,
      unmatched,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalGstAmount: parseFloat(totalGstAmount.toFixed(2)),
      totalGstPercentage: parseFloat(totalGstPercentage.toFixed(2))
    });
  } catch (error) {
    console.error("Error finding products:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


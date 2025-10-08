import SubProduct from "../../modules/storeAdmin/SubProduct.js";
import multer from "multer";



// Required node packages
// Run: npm install axios fluent-ffmpeg @ffmpeg-installer/ffmpeg form-data

import fs from "fs";
import axios from "axios";
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import FormData from "form-data";
import moment from 'moment'
// const ffmpeg = require("fluent-ffmpeg");
// const ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
// const path = require("path");
// const FormData = require("form-data");

import dotenv from 'dotenv'

dotenv.config();

// ==========================================================================================


const validateSubProductInput = ({ categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty }) => {
  if (!categoryId || !productId || !unit || !mrpPrice || !discountPrice || !stockAvailableQty) {
    return 'All fields are required';
  }
  if (typeof mrpPrice !== 'number' || typeof discountPrice !== 'number' || typeof stockAvailableQty !== 'number') {
    return 'Prices and stock must be numeric';
  }
  return null;
};


// Add SubProduct
export const addSubProduct = async (req, res) => {
  try {
    const { categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty, storeId } = req.body;

    const error = validateSubProductInput({ categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty });
    if (error) return res.status(400).json({ message: error });

    const subProduct = new SubProduct({
      categoryId,
      productId,
      storeId,
      unit,
      mrpPrice,
      discountPrice,
      stockAvailableQty
    });

    await subProduct.save();
    res.status(201).json(subProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error adding sub-product', error: err.message });
  }
};


// Get SubProducts by Product ID
export const getSubProductsByStoreId = async (req, res) => {
  try {
    const subProducts = await SubProduct.find({ storeId: req.params.storeId })
      .populate('productId', 'name')
      .populate('categoryId', 'name');

    res.json(subProducts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sub-products', error: err.message });
  }
};



export const updateSubProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty, storeId } = req.body;

    const error = validateSubProductInput({ categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty });
    if (error) return res.status(400).json({ message: error });

    const subProduct = await SubProduct.findByIdAndUpdate(
      id,
      { categoryId, productId, unit, mrpPrice, discountPrice, stockAvailableQty, storeId },
      { new: true }
    );

    if (!subProduct) return res.status(404).json({ message: 'Sub-product not found' });

    res.json({ message: 'Sub-product updated successfully', subProduct });
  } catch (err) {
    res.status(500).json({ message: 'Error updating sub-product', error: err.message });
  }
};




// ==========================================================================================


// 🔁 Your Groq API Key
const apiKey = process.env.GROQ_API_KEY;
const transcriptionUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
const translationUrl = "https://api.groq.com/openai/v1/audio/translations";

// 🧠 Tamil to English mapping
const customDict = {
    "மூன்றுக்கால்": "3/4", "முக்கால்": "3/4", "மூன்றரை": "3 1/2",
  "ஒரரை": "1 1/2", "ஒன்றரை": "1 1/2", "இரண்டுகால்": "2 1/4",
  "அரை": "1/2", "கால்": "1/4",
  "கிலோ": "kg", "கிலோம்": "kg", "கிலோவை": "kg",
  "ரூபா": "rs", "ரூபாய்": "rs", "ரொபாய்": "rs", "ரூ": "rs", "ருபாய்": "rs",
  "பாக்கெட்": "packet", "பேக்கெட்": "packet", "பீஸ்": "piece", "பீசு": "piece",
  "நொஸ்": "nos", "நம்பர்": "nos",
  "சிக்கன்": "chicken", "கொள்ளி": "chicken", "கொழி": "chicken", "கோழி": "chicken",
  "கோழிக்கறி": "chicken", "நாட்டுக்கோழி": "country chicken", "நாட்டு கோழி": "country chicken",
  "நாட்டுக்கொழி": "country chicken", "நாட்டு கோழிக்கறி": "country chicken",
  "broiler": "chicken", "சிக்கன் மீட்": "chicken meat",
  "மட்டன்": "mutton", "மட்டை": "mutton", "ஆட்டுக்கறி": "mutton", "ஆட்டுக்கொழி": "mutton",
  "ஆடு இறைச்சி": "mutton", "ஆடுகறி": "mutton", "ஆடு": "mutton", "ஆட்டு": "mutton",
  "செம்மறி": "lamb", "செம்மறி ஆடு": "lamb", "லேம்": "lamb",
  "பீஃப்": "beef", "மாடு": "beef", "மாடு இறைச்சி": "beef", "மாடு கடை": "beef meat shop",
  "காளை": "beef", "காளை இறைச்சி": "beef", "மாடுப் பசு": "beef",
  "பன்றி": "pork", "பன்றி கறி": "pork", "பன்றி இறைச்சி": "pork",
  "pani curry": "pork curry", "panni curry": "pork curry", "Pannikeri": "pork curry",
  "wild boar": "wild boar", "காடுப்பன்றி": "wild boar", "வன பன்றி": "wild boar", "காடு பன்றி": "wild boar",
  "மான்": "deer", "மான் இறைச்சி": "deer", "காவுதாரி": "deer", "காவுத்தரி": "deer", "kaavuthari": "deer",
  "முயல்": "rabbit", "ராபிட்": "rabbit",
  "காடை": "quail", "காடை இறைச்சி": "quail", "quail": "quail",
  "வான்கோழி": "guinea fowl", "guinea fowl": "guinea fowl",
  "திட்டி": "wild bird", "பறவை": "bird meat", "பறவை இறைச்சி": "bird meat",
  "டர்கி": "turkey", "தர்கி": "turkey", "turkey": "turkey",
  "ஒட்டகம்": "camel", "ஒட்டக இறைச்சி": "camel", "camel meat": "camel",
  "யானை": "elephant meat",
  "பாம்பு": "snake", "பாம்பு இறைச்சி": "snake meat",
  "உடும்பு": "monitor lizard", "udumbu": "monitor lizard", "ஒட்டாம்பாம்பு": "monitor lizard",
  "லிசர்ட்": "lizard meat", "lizard": "lizard meat",
  "ஆமை": "turtle", "ஆமை இறைச்சி": "turtle meat", "tortoise": "turtle meat",
  "அணில்": "squirrel meat", "squirrel": "squirrel meat",
  "மீன்": "fish", "பிஷ்": "fish", "வஞ்சிரம்": "seer fish", "வால்பாரி": "seer fish", "Vanjanam fish": "seer fish",
  "சால்மன்": "salmon", "பராய்": "barracuda", "சாம்பல்": "sardine",
  "நெய்மீன்": "butter fish", "கொழுவா": "mackerel", "கெண்டை": "catla",
  "ரோகா": "rohu", "சிங்காரா": "king fish", "வெள்ளை மீன்": "white fish",
  "நண்டு": "crab", "பூநண்டு": "crab", "crab": "crab",
  "இறால்": "prawn", "இறா": "prawn", "பூநிறால்": "prawn", "shrimp": "prawn",
  "கருவாடு": "dry fish", "உலர்ந்த மீன்": "dry fish", "dryfish": "dry fish",
  "அரண்மீன்": "shellfish", "octopus": "octopus", "squid": "squid", "சீப்பி": "shellfish",
  "எறும்பு": "ant", "வண்டு": "beetle", "வம்பு": "earthworm",
  "நண்டு வண்டு": "cricket", "வேந்தன்": "maggot larvae", "தட்டா வண்டு": "cicada",
  "உயிரியல் உணவு": "insect protein",
  "மஜ்ஜை": "brain", "நுரையீரல்": "lung", "கல்லீரல்": "liver", "இடுப்பு": "hip",
  "சட்டை": "ribs", "வயிறு": "stomach", "நடை": "neck", "பைச்சு": "thigh",
  "பொத்தி": "kidney", "பல்லி": "tripe", "மூக்கு": "snout", "கால்": "feet",
  "எலும்பு": "bone", "தலை": "head", "தோல்": "skin", "மீன் தொப்பி": "fish head",
  "முட்டை": "egg", "முட்ட": "egg", "எக்": "egg",
  "வாத்து முட்டை": "duck egg", "duck egg": "duck egg", "quail egg": "quail egg",
  "பூச்சி முட்டை": "insect egg",
  "மாமிசம்": "meat", "இறைச்சி": "meat", "கறி": "meat", "இறைச்சி வகைகள்": "meat",
  "non veg": "meat", "non-veg": "meat"
  
};


function normalizeTamilText(text) {
  for (const [tamil, eng] of Object.entries(customDict)) {
    text = text.replace(new RegExp(tamil, "gi"), eng);
  }
  return text.replace(/\s+/g, " ").trim();
}


// Configure file upload
const upload = multer({ dest: "uploads/" });

ffmpeg.setFfmpegPath(ffmpegPath);
// Convert any input audio to WAV format
function convertToWav(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .format("wav")
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", reject)
      .run();
  });
}

// Send audio file to Groq API
async function sendToGroq(url, audioPath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(audioPath));
  form.append("model", "whisper-large-v3");

  const res = await axios.post(url, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${apiKey}`
    }
  });

  return res.data.text;
}


async function refineTextWithGroq(text) {
  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a multilingual butcher-shop assistant trained to understand mixed Tamil-English voice inputs related to meat and grocery orders. 
The sentences you receive are usually spoken, jumbled, and contain phonetic spellings, Tamil words, or slang.

Your job is to:
1. Correct all spelling mistakes related to:
   - Meat items (e.g., "chikan", "naatu kozhi", "panni curry", "vanjanam")
   - Measurement units (e.g., "kilogaram", "killo", "litters")
   - Currency (e.g., "rooopya", "rupiya", "roobai")

2. Understand and translate Tamil/local words and fractions:
   - e.g., "முக்கால்" → "3/4", "ஒரரை" → "1 1/2", "அரை" → "1/2"
   - e.g., "நாட்டு கோழி" → "country chicken", "வஞ்சிரம்" → "seer fish", "panni curry" → "pork curry"

3. Normalize the output format as:
   "<quantity> <unit> of <product> for <price> rupees"

4. Handle flexible spoken order.
5. Support multiple items per input.
6. Preserve numeric values (if missing, use "null").
7. If the quantity is less than 1 (e.g., 1/2 or 3/4), convert it to grams (e.g., 0.5 kg → 500 grams). Otherwise, use “kg”.
8. Always express quantity in decimal (e.g., 2.75 kg) or split units (e.g., 2 kg 750 gram). Never use fractional format like 3/4 or 1 1/2.
9. Do NOT explain. Return only structured lines.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.2
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content.trim();
}



function extractOrderDetails(text) {
 const productRegex = /(chicken|mutton|fish|egg|pork curry|pork|seer fish|sardine|barracuda|rohu|crab|prawn|dry fish|white fish|salmon|catla|king fish|butter fish|deer|rabbit|quail|turkey|camel|lamb|beef|monitor lizard|squid|octopus|brain|liver|lung)/gi;
  const priceRegex = /(\d+(?:\.\d+)?)\s*(rs|rupees|rupiah)/gi;

  // ✅ Match decimal or integer quantities with "kg"
  const quantityRegex = /(\d+(?:\.\d+)?)(?=\s*kg|kilogram|kilograms|kgs)/gi;

  const products = [...text.matchAll(productRegex)].map(m => m[1].toLowerCase());
  const prices = [...text.matchAll(priceRegex)].map(m => m[1]);

  const quantities = [];
  let match;
  while ((match = quantityRegex.exec(text)) !== null) {
    const kgVal = parseFloat(match[1]);
    const kg = Math.floor(kgVal);
    const grams = Math.round((kgVal - kg) * 1000);

    let formattedQty = "";
    if (kg > 0) formattedQty += `${kg}kg`;
    if (grams > 0) formattedQty += `${grams}gram`;
    if (!formattedQty) formattedQty = "null";
    quantities.push(formattedQty);
  }

  const maxLength = Math.max(products.length, quantities.length, prices.length);
  const structuredList = [];

  for (let i = 0; i < maxLength; i++) {
    structuredList.push({
      product: products[i] || "null",
      quantity: quantities[i] || "null",
      price: prices[i] || "null"
    });
  }

  return structuredList;
}

// Handle POST request from Postman
export const meatPad = async (req, res) => {
  const orig = req.file.path;
  const conv = orig + ".wav";

  try {
    await convertToWav(orig, conv);
    let text = await sendToGroq(transcriptionUrl, conv);

    if (!/[a-zA-Z]/.test(text)) {
      text = await sendToGroq(translationUrl, conv);
    }

    const refinedText = await refineTextWithGroq(text);
    let cleanText = refinedText;
    const matchCorrected = refinedText.match(/"([^"]+)"/);
    if (matchCorrected) cleanText = matchCorrected[1];

    cleanText = normalizeTamilText(cleanText);
    const structuredData = extractOrderDetails(cleanText);

    res.json({
      message: "✅ Transcribed and Extracted Successfully",
      originalText: refinedText,
      structuredData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
     try { await fs.promises.unlink(orig); } catch {}
  try { await fs.promises.unlink(conv); } catch {}
  }
};

// // Start server
// app.listen(port, () => {
//   console.log(`🚀 Server running at http://localhost:${port}`);
// });




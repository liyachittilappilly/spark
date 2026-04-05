import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI (will be re-initialized in handlers for robustness)
let ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API: NDVI Crop Health Monitoring (Mocked GEE Logic)
  app.post("/api/ndvi", (req, res) => {
    const { polygon } = req.body;
    if (!polygon) {
      return res.status(400).json({ error: "Polygon is required" });
    }

    // Mocking NDVI calculation
    // In a real scenario, this would call Google Earth Engine
    const mean = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
    const min = mean - 0.15;
    const max = mean + 0.15;

    let classification = "Low";
    if (mean > 0.66) classification = "High";
    else if (mean > 0.33) classification = "Medium";

    res.json({
      stats: {
        min: min.toFixed(2),
        max: max.toFixed(2),
        mean: mean.toFixed(2),
      },
      classification,
      tileUrl: `https://picsum.photos/seed/${Math.random()}/512/512`, // Mock tile
    });
  });

  // In-memory store for cumulative detections (Mocking a database)
  let cumulativePestHistory: any[] = [];

  // API: Weather-Based Pest Prediction Model
  // log(BPH) = -23.289 + 0.741(Tmax) + 0.021(RF) + 0.051(RH²)
  app.post("/api/predict-pest", (req, res) => {
    const { tmax, rf, rh } = req.body;
    
    if (tmax === undefined || rf === undefined || rh === undefined) {
      return res.status(400).json({ error: "Tmax, RF, and RH are required" });
    }

    // 1. Specific BPH Regression formula
    const logBPH = -23.289 + 0.741 * tmax + 0.021 * rf + 0.051 * Math.pow(rh, 2);
    const predictedBPH = Math.exp(logBPH);

    // 2. Multi-pest "Chance" logic for others
    const calculateChance = (temp: number, hum: number, rain: number, ideal: any) => {
      let score = 0;
      if (temp >= ideal.tMin && temp <= ideal.tMax) score += 40;
      if (hum >= ideal.rhMin) score += 30;
      if (rain >= ideal.rfMin && rain <= ideal.rfMax) score += 30;
      return Math.min(score, 100);
    };

    const pests = [
      {
        id: 'bph',
        name: 'Brown Plant Hopper',
        predictedCount: predictedBPH.toFixed(2),
        chance: Math.min(Math.round((predictedBPH / 40) * 100), 100), // Scale to % for UI
        pesticide: 'Imidacloprid 17.8 SL or Buprofezin 25 SC',
        description: 'Ideal: 25-32°C, >70% Humidity, Low-Mod Rainfall'
      },
      {
        id: 'sb',
        name: 'Stem Borer',
        chance: calculateChance(tmax, rh, rf, { tMin: 25, tMax: 30, rhMin: 60, rfMin: 10, rfMax: 40 }),
        pesticide: 'Cartap Hydrochloride 50 SP or Chlorantraniliprole 18.5 SC',
        description: 'Ideal: 25-30°C, Mod-High Humidity, Moderate Rainfall'
      },
      {
        id: 'lf',
        name: 'Leaf Folder',
        chance: calculateChance(tmax, rh, rf, { tMin: 25, tMax: 35, rhMin: 80, rfMin: 20, rfMax: 60 }),
        pesticide: 'Flubendiamide 39.35 SC or Indoxacarb 14.5 SC',
        description: 'Ideal: 25-35°C, High Humidity, Mod-High Rainfall'
      }
    ];

    const highestRisk = [...pests].sort((a, b) => b.chance - a.chance)[0];

    res.json({
      pests,
      highestRisk,
      predictedBPH: predictedBPH.toFixed(2),
      sprayAlert: predictedBPH >= 20,
      insights: {
        tempEffect: "Temperature ↑ → insect growth ↑",
        humidityEffect: "Humidity ↑ → survival ↑",
        rainfallEffect: "Rainfall ↑ → insect reduction",
      }
    });
  });

  // API: Intelligent Decision Engine
  app.post("/api/decision-engine", (req, res) => {
    const { ndvi, predictedBPH, pestDetected } = req.body;

    let riskLevel = "LOW";
    let explanation = "All parameters are within safe limits.";

    if (ndvi < 0.4 && predictedBPH > 15 && pestDetected) {
      riskLevel = "HIGH RISK";
      explanation = "NDVI is low (crop stress), predicted BPH is high, and pests were detected. Immediate action required.";
    } else if (ndvi < 0.5 || predictedBPH > 10 || pestDetected) {
      riskLevel = "MODERATE";
      explanation = "Some parameters show signs of stress or pest presence. Monitor closely.";
    }

    res.json({ riskLevel, explanation });
  });

  // API: NDVI Time-Series (Mocked)
  app.get("/api/ndvi-history", (req, res) => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      date: new Date(Date.now() - (9 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ndvi: 0.3 + Math.random() * 0.5
    }));
    res.json(history);
  });

  // Mock Alert Service (Simulating SMS/Notification)
  const sendAlert = (message: string) => {
    console.log(`[ALERT SERVICE] Sending Notification: ${message}`);
    // In a real app, this would use Firebase Cloud Messaging or an SMS API like Twilio
  };

  // API: Get/Update Cumulative Detection History
  app.get("/api/pest-history", (req, res) => {
    res.json(cumulativePestHistory);
  });

  app.post("/api/pest-history", (req, res) => {
    const { count, pestName } = req.body;
    const newEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      count,
      pestName
    };
    cumulativePestHistory.push(newEntry);
    
    // Keep only last 20 entries
    if (cumulativePestHistory.length > 20) {
      cumulativePestHistory.shift();
    }

    // Check for cumulative alert
    const recentTotal = cumulativePestHistory
      .filter(e => (Date.now() - new Date(e.timestamp).getTime()) < 3600000) // Last hour
      .reduce((sum, e) => sum + e.count, 0);

    let alert = null;
    if (recentTotal > 50) {
      alert = {
        type: 'SMS_ALERT',
        message: `CRITICAL: Cumulative pest count reached ${recentTotal} in the last hour. Immediate action required!`
      };
      sendAlert(alert.message);
    }

    res.json({ history: cumulativePestHistory, alert });
  });

  // API: AI Pest Advisor (Gemini)
  app.post("/api/gemini-advice", async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    const key = process.env.GEMINI_API_KEY.trim();
    console.log(`Using API key: ${key.substring(0, 4)}...${key.substring(key.length - 4)} (length: ${key.length})`);

    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const prompt = `
        Act as an expert agricultural pest advisor specializing in rice (paddy) crops.
        User Question: "${query}"
        
        Please provide a concise response (under 100 words) that:
        1. Identifies the pest or issue.
        2. Explains why it occurs (environmental factors).
        3. Describes the impact on rice crops.
        4. Suggests a simple, effective treatment or management strategy.
        
        Keep the tone professional and helpful.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });
      const responseText = result.text;

      res.json({ response: responseText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to get advice from AI. Please try again later." });
    }
  });

  // API: Proxy image fetch to bypass CORS and Tainted Canvas
  app.post("/api/proxy-image", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      res.json({ image: `data:${response.headers.get('content-type') || 'image/jpeg'};base64,${base64}` });
    } catch (error: any) {
      console.error("Proxy Image Error:", error);
      res.status(500).json({ error: "Failed to proxy image." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

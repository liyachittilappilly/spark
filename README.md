# 🌾 AI-Powered Smart Pest Detection System for Paddy Fields

> 🚀 A Google AI-driven precision agriculture platform that enables **early pest detection, crop health monitoring, and intelligent decision-making** using satellite data, weather analytics, and AI.

---

## 📌 Problem Statement

Agriculture is critical for food security, yet farmers face major challenges:

* ❌ Pest detection occurs **after visible damage**
* ❌ Heavy reliance on **manual field inspection**
* ❌ Lack of **real-time, data-driven insights**
* ❌ Excessive pesticide use leading to **economic loss & environmental damage**

👉 **Key Gap:** No scalable system exists for **early-stage pest detection and prediction**.

---

## 💡 Our Solution

We built an **AI-powered smart agriculture system** that integrates:

* 🛰 **Satellite Data (NDVI)** → Crop health monitoring
* 🌦 **Weather Intelligence** → Pest prediction
* 🤖 **AI Models** → Pest detection & advisory
* 📊 **Decision Engine** → Early warning alerts

> 🎯 **Goal:** Detect pest risks *before visible damage occurs* and enable smarter interventions.

---

## 🧠 Core Features

### 🌿 1. NDVI-Based Crop Health Monitoring

* Uses **Sentinel-2 satellite imagery**

* Computes:

  ```
  NDVI = (NIR - Red) / (NIR + Red)
  ```

* Classifies crop health:

  * 🔴 Low
  * 🟠 Medium
  * 🟢 High

---

### 🌦 2. Weather-Based Pest Prediction

Mathematical regression model:

```
log(BPH) = -23.289 + 0.741(Tmax) + 0.021(RF) + 0.051(RH²)
```

📊 Insights:

* Temperature ↑ → pest growth ↑
* Humidity ↑ → survival ↑
* Rainfall ↑ → reduces pests

---

### 🧠 3. AI Pest Detection

Detects major paddy pests:

* 🐛 Brown Planthopper
* 🐛 Leaf Folder
* 🐛 Stem Borer

Outputs:

* Pest type
* Confidence score
* Recommended treatment

---

### 🚨 4. Threshold-Based Alert System

| Pest Count | Risk Level      |
| ---------- | --------------- |
| 0–5        | SAFE            |
| 6–15       | MONITOR         |
| 16–30      | WARNING         |
| 30+        | ACTION REQUIRED |

📌 Economic Threshold:

> ≥ 20 BPH → Trigger spray alert

---

### 🧠 5. Intelligent Decision Engine

```python
IF:
 NDVI < 0.4
 AND predicted_BPH > 15
 AND pest_detected == True

THEN:
 HIGH RISK ALERT
```

👉 Combines multiple data sources for **accurate early warning**

---

### 💬 6. AI Assistant (Google Gemini)

* Farmer queries → AI explanations
* Pest understanding
* Actionable recommendations

---

## 🧩 System Architecture

```
User Input (Map + Image + Weather)
        ↓
NDVI (Google Earth Engine)
        ↓
Weather Model + Pest Detection
        ↓
Decision Engine
        ↓
Alerts + Recommendations + AI Assistant
```

---

## ⚙️ Tech Stack

### 🌐 Frontend

* React + Vite
* Leaflet (Map interaction)

### ⚙️ Backend

* FastAPI (Python)

### ☁️ Google Technologies

* Google Earth Engine → Satellite NDVI
* Gemini API → AI advisory
* Firebase → Data & alerts

---

## 🔄 System Pipeline

1. 📡 Satellite Image Processing
2. 🌿 NDVI Extraction
3. 🤖 AI Classification
4. 📊 Weather Analysis
5. 🧠 Decision Engine
6. 🚨 Alert Generation

---

## 📈 Key Innovations

* 🔥 Combines **satellite + weather + AI**
* ⚡ Detects pests **before visible damage**
* 🌍 Scalable to large agricultural regions
* 💡 Reduces unnecessary pesticide usage

---

## 🚀 Future Enhancements

* 📊 NDVI Time-series visualization
* 📱 Mobile alerts (SMS / App)
* 🌐 Multi-language support
* 🤖 IoT-based real-time pest traps

---

## 🧠 Why This Matters

* 🌾 Improves crop yield
* 💰 Reduces farmer losses
* 🌱 Promotes sustainable farming
* ⚡ Enables data-driven agriculture

---

## 🎯 Conclusion

> This system transforms traditional farming into **intelligent agriculture** by combining **remote sensing, AI, and predictive analytics**.

---

## 👨‍💻 Team

* Your Team Name
* Members

---

## 📌 Hackathon Note

This project leverages **Google AI tools efficiently within limited cloud credits**, focusing on **impact, scalability, and real-world usability**.

---

⭐ *Built with the vision to empower farmers through AI*

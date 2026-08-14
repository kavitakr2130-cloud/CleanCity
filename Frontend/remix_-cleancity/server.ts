import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser
  app.use(express.json());

  // Initialize Gemini client if API key is present
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }

  // API Route: AI Municipal Helper Chatbot
  app.post("/api/chatbot", async (req, res) => {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      if (!ai) {
        // High fidelity custom responsive local backup when key is not loaded yet (failsafe)
        const lowercaseMsg = message.toLowerCase();
        let responseText = "Thank you for reaching out to CleanCity. I'm here to assist with any questions about municipal waste management, reporting garbage, and CleanPoints rewards!";

        if (lowercaseMsg.includes("cleanpoints") || lowercaseMsg.includes("points") || lowercaseMsg.includes("rewards")) {
          responseText = "You earn **CleanPoints** for every approved garbage report you log! Once your report is inspected and marked as **RESOLVED** by the Admin, you will receive up to **500 CleanPoints**. You can redeem these points in your Profile section for public utility discounts, bus passes, and municipal tax rebates.";
        } else if (lowercaseMsg.includes("how to report") || lowercaseMsg.includes("submit") || lowercaseMsg.includes("report") || lowercaseMsg.includes("photo")) {
          responseText = "To submit a report, go to the **Report** tab (Camera icon) in the bottom navigation bar. You can upload a photo from your gallery or take a live picture using your camera. Our AI vision system will automatically classify the category of waste, and we'll detect your GPS location automatically on the interactive map. Finally, add an optional description and press **Submit** to notify our municipal dispatchers.";
        } else if (lowercaseMsg.includes("category") || lowercaseMsg.includes("hazardous") || lowercaseMsg.includes("plastic") || lowercaseMsg.includes("waste")) {
          responseText = "We classify municipal waste into four major categories: \n\n1. ♻️ **Plastic & Metal** (recycles, bottles, cans)\n2. 🍎 **Organic Waste** (compost, food leftovers)\n3. ⚠️ **Hazardous Materials** (batteries, chemical containers, medical waste)\n4. 🪵 **Construction/Bulky Waste** (concrete blocks, large furniture, wood)\n\nReporting hazardous material triggers high-priority alerts to our rapid-response crew immediately!";
        } else if (lowercaseMsg.includes("time") || lowercaseMsg.includes("how long") || lowercaseMsg.includes("resolve") || lowercaseMsg.includes("crew")) {
          responseText = "Standard reports are reviewed by our municipal administrative panel within **24 hours**. Once assigned to a local sanitation crew, resolution times depend on priority: \n\n- 🔴 **High Priority (Hazardous spills):** Resolved in **2-4 hours**.\n- 🟡 **Medium Priority (Plastic/Organic blocks):** Cleared within **12-24 hours**.\n\nYou can track live updates in real-time on your Home dashboard or Citizen Map!";
        } else if (lowercaseMsg.includes("hello") || lowercaseMsg.includes("hi") || lowercaseMsg.includes("hey") || lowercaseMsg.includes("help")) {
          responseText = "Hello! Welcome to the CleanCity AI Municipal Help Center. Ask me anything about waste reporting, garbage pickup, rewards, or sanitation rules, and I'll assist you immediately!";
        }

        return res.json({ text: responseText, isSimulated: true });
      }

      // Prepare system instructions for CleanCity Municipal Bot
      const systemInstruction = `You are "CleanBot", the official AI Municipal Assistant for CleanCity. Your job is to answer all citizen questions about garbage disposal, sanitation rules, reporting issues, tracking status, and earning CleanPoints.
Keep your answers professional, friendly, helpful, and direct. Support Markdown formatting for neat listings and bullet points.
Explain:
- Reporting: Go to Report tab, snap or upload photo, AI classifies it, GPS tracks it, description is optional.
- CleanPoints Rewards: Log reports, earn points when Admin resolves them. Level up (Bronze, Silver, Gold, Platinum). Redeem points for municipal discounts.
- Priority: Hazardous materials get High priority, plastic/organic get Medium or Low.
- Response Time: Hazardous within 2-4 hours; standard reports resolved within 24-48 hours.
Answer all queries accurately and clearly based on municipal waste management best practices.`;

      // Call Gemini API
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          { role: "user", parts: [{ text: `System: ${systemInstruction}\n\nUser: ${message}` }] }
        ],
      });

      return res.json({ text: response.text || "I'm processing your request. Please try again in a moment." });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      return res.status(500).json({ error: error.message || "An error occurred while generating response" });
    }
  });

  // API Route: AI-powered Translator
  app.post("/api/translate", async (req, res) => {
    const { text, targetLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: "Text and targetLanguage are required" });
    }

    try {
      if (!ai) {
        return res.status(503).json({ error: "Translation engine is currently offline (API key not configured)." });
      }

      // Call Gemini 3.5 Flash for precise translation
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a precise, context-aware municipal translator for CleanCity.
Translate the following user-generated text into "${targetLanguage}".

Rules:
1. Preserve all original emojis, formatting, punctuation, line breaks, names, and places exactly.
2. Translate the text naturally and accurately so a native speaker of "${targetLanguage}" can understand it.
3. If the input text is already in "${targetLanguage}" or is extremely close, return the original text exactly as-is.
4. Do NOT add any extra notes, explanation, prefix, suffix, quotes or markdown wrappers. Return ONLY the translated string.

Text to translate:
"""
${text}
"""`
              }
            ]
          }
        ]
      });

      const translatedText = response.text ? response.text.trim() : text;
      return res.json({ translatedText });
    } catch (error: any) {
      console.error("Translation API error:", error);
      return res.status(500).json({ error: error.message || "An error occurred during translation" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

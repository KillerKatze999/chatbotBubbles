import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("API Key loaded:", process.env.bubbles4dus_key ? "YES" : "NO");

app.post("/chat", async (req, res) => {
  const msg = req.body.message;

  try {
    if (msg.length > 500) {
      return res.json({ reply: "Nachricht zu lang." });
    }
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.bubbles4dus_key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 150,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `
Du bist der Assistent von Bubbles4Dus.

Die Website bietet:
- Strategieberatung im Bereich Champagner
- Markenentwicklung
- Portfolio-Strategie

Antworte professionell, stilvoll und präzise.
Keine Emojis.
`
          },
          { role: "user", content: msg }
        ]
      })
    });

    const data = await r.json();

    console.log("API RESPONSE RAW:", JSON.stringify(data, null, 2));

    if (!data.choices || !data.choices[0]) {
      return res.json({
        reply: "API Fehler: " + (data.error?.message || "Unbekannt")
      });
    }

    res.json({ reply: data.choices[0].message.content });
  } catch (err) {
      console.error("FULL ERROR:", err);
      res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
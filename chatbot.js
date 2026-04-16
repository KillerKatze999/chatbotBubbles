import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("API Key loaded:", process.env.bubbles4dus_key ? "YES" : "NO");

app.post("/chat", async (req, res) => {
  const msg = req.body.message?.trim();

  try {
    if (!msg) {
      return res.json({ reply: "Nachricht leer." });
    }
    if (msg.length > 500) {
      return res.json({ reply: "Nachricht zu lang." });
    }
    if (!process.env.bubbles4dus_key) {
      return res.status(500).json({ reply: "Server Konfiguration fehlt." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.bubbles4dus_key}`,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 80,
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `
Du bist der Assistent von Bubbles4Dus.

Die Website bietet:
- Strategieberatung im Bereich Champagner
- Markenentwicklung
- Portfolio-Strategie

Antworte:
- kurz (maximal 2 Sätze)
- elegant
- selbstbewusst
- beratend

Antworte immer direkt und vermeide unnötige Einleitungen.

Vermeide generische Formulierungen wie:
"Die Kosten variieren je nach Umfang und Anforderungen".

Sprich so, als würdest du direkt mit einem Kunden sprechen, nicht wie in einem Angebotstext.

Keine Emojis.

Wenn der Nutzer allgemein fragt (z. B. "Hallo", "Hi"):
→ begrüße kurz und leite direkt in Beratung über.

Wenn der Nutzer nach Leistungen fragt:
→ nenne konkrete Beispiele und biete Unterstützung an.

Wenn es sinnvoll ist:
→ schlage dem Nutzer stilvoll vor, Kontakt aufzunehmen (z. B. per E-Mail).

Bleibe dabei unaufdringlich und hochwertig.
`
          },
          { role: "user", content: msg }
        ]
      })
    });

    clearTimeout(timeout);
    // 🔥 WICHTIG: HTTP Status check
    if (!r.ok) {
      const error = await r.json();
      console.error("API ERROR:", error);
      return res.json({
        reply: "Der Assistent ist aktuell nicht verfügbar."
      });
    }

    const data = await r.json();

    console.log("API RESPONSE RAW:", JSON.stringify(data, null, 2));

    const reply = data.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.json({
        reply: "Der Assistent ist aktuell nicht verfügbar."
      });
    }

    res.json({ reply });
  } catch (err) {
      console.error("FULL ERROR:", err);
      res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
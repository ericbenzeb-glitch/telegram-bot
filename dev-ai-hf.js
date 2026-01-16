import fetch from "node-fetch";

export async function askDevAIHF(question) {
  const HF_TOKEN = process.env.HF_API_KEY;
  if (!HF_TOKEN) throw new Error("HuggingFace Token fehlt");

  try {
    // Router API Endpoint
    const response = await fetch(
      "https://router.huggingface.co/models/gpt2", // hier ggf. anderes Modell wählen
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: `Du bist ein erfahrener Telegram Bot Entwickler.\nBeantworte die folgende Frage:\n${question}`,
          options: { use_cache: false }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HuggingFace Router API Fehler: ${response.status} ${text}`);
    }

    const json = await response.json(); // ✅ richtig deklariert
    // Router API liefert ein Array oder Objekt, je nach Modell
    // Wir greifen auf generated_text zu
    if (Array.isArray(json) && json[0]?.generated_text) {
      return json[0].generated_text;
    } else if (json.generated_text) {
      return json.generated_text;
    } else {
      return "Keine Antwort vom Modell";
    }

  } catch (err) {
    console.error("❌ HF DEV AI ERROR", err);
    throw err; // damit bot.js den Fehler abfangen kann
  }
}
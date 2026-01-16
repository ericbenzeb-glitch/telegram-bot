import fetch from "node-fetch";

export async function askDevAIHF(question) {
  const HF_TOKEN = process.env.HF_API_KEY;
  if (!HF_TOKEN) throw new Error("HuggingFace Token fehlt!");

  const MODEL = "meta-llama/Llama-3.1-8B-Instruct";

  const res = await fetch(
    "https://router.huggingface.co/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: "Du bist ein hilfreicher Entwickler-Assistent." },
                   { role: "user", content: question }]
      })
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API Fehler ${res.status}: ${text}`);
  }

  const json = await res.json();
  const answer = json.choices?.[0]?.message?.content;
  return answer || "Keine Antwort vom Modell";
}
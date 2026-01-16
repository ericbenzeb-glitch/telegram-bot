import fetch from "node-fetch";

export async function askDevAIHF(question) {
  const HF_TOKEN = process.env.HF_API_KEY;
  if (!HF_TOKEN) throw new Error("HuggingFace Token fehlt");

  const payload = {
    inputs: `DEV ASSISTANT:\n${question}`,
    options: { use_cache: false }
  };

  const res = await fetch(
    "https://api-inference.huggingface.co/models/your‑chosen‑model",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json[0]?.generated_text ?? "Keine Antwort";
}

import fetch from "node-fetch";

export async function askDevAIHF(question) {
  const HF_TOKEN = process.env.HF_API_KEY;
  if (!HF_TOKEN) throw new Error("HuggingFace Token fehlt");

  const payload = {
    inputs: `DEV ASSISTANT:\n${question}`,
    options: { use_cache: false }
  };

  const response = await fetch(
  "https://router.huggingface.co/models/gpt2",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inputs: `DEV ASSISTANT:\n${question}`,
      options: { use_cache: false }
    })
  }
);

  console.log(json); // einmal loggen, um zu sehen, wo generated_text steckt

// Beispiel Anpassung
return json[0]?.generated_text || "Keine Antwort vom Modell";
  if (json.error) throw new Error(json.error);
  return json[0]?.generated_text ?? "Keine Antwort";
}

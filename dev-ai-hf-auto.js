import fetch from "node-fetch";

const HF_MODELS = [
  "meta-llama/Llama-3.1-8B-Instruct"
];

let workingModel = null;

export async function askDevAIHF(question) {
  const HF_TOKEN = process.env.HF_API_KEY;
  if (!HF_TOKEN) throw new Error("HuggingFace Token fehlt!");

  if (workingModel) return await callHF(workingModel, question, HF_TOKEN);

  // Auto-Test
  for (const model of HF_MODELS) {
    try {
      const answer = await callHF(model, question, HF_TOKEN);
      workingModel = model;
      console.log(`✅ Funktionierendes Modell gefunden: ${model}`);
      return answer;
    } catch (err) {
      console.warn(`❌ Modell ${model} funktioniert nicht: ${err.message}`);
      continue;
    }
  }

  throw new Error("Kein funktionierendes HF-Modell gefunden.");
}

async function callHF(model, question, token) {
  const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: "Du bist ein hilfreicher Entwickler-Assistent." },
        { role: "user", content: question }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HF API Fehler ${res.status}: ${text}`);
  }

  const json = await res.json();
  const answer = json.choices?.[0]?.message?.content;
  if (!answer) throw new Error("Keine Antwort vom Modell");
  return answer;
}
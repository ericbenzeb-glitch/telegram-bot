import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * WICHTIG:
 * Dieser Kontext beschreibt DEIN echtes Projekt.
 * Du kannst ihn jederzeit erweitern.
 */
const PROJECT_CONTEXT = `
Projektübersicht:
- Telegram Clicker Game
- WebApp: stars-ton-clicker (Vanilla JS, läuft auf Vercel)
- Bot: telegram-bot (Node.js, läuft auf Render)

Architektur:
- Telegram Bot ist Game-Authority
- WebApp ist nur UI
- Keine Datenbank
- Kommunikation über Telegram WebApp sendData
- Anti-Cheat über Rate-Limit & Server-Side Validation

WebApp:
- Vanilla JS
- Click-Button
- Kein eigenes Scoring
- Kein Persistenz-State

Bot:
- Validiert Klicks
- Zählt Stars serverseitig
- Rate-Limit (~200ms)
- Click Window Anti-Autoclicker
- In-Memory User State (Map)

Ziel:
- Cheat-resistentes Telegram Game
- Einfach erweiterbar
- Monetarisierbar (Stars / TON)
`;

export async function askDevAI(question) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Du bist ein Senior Telegram Game Developer.
Du kennst den kompletten Code und die Architektur dieses Projekts.

${PROJECT_CONTEXT}
        `
      },
      {
        role: "user",
        content: question
      }
    ],
    temperature: 0.2
  });

  return completion.choices[0].message.content;
}

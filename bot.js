// ============================
// IMPORTS & ENV
// ============================
import { Telegraf } from "telegraf";
import { askDevAIHF as askDevAI } from "./dev-ai-hf-auto.js";
import dotenv from "dotenv";

dotenv.config(); // nur lokal nötig, Render nutzt ENV direkt

// ============================
// ENV CHECK
// ============================
if (!process.env.BOT_TOKEN) throw new Error("❌ BOT_TOKEN fehlt");
if (!process.env.OPENAI_API_KEY) throw new Error("❌ OPENAI_API_KEY fehlt");

console.log("🤖 Bot startet...");
console.log(
  "🔑 OpenAI Key:",
  process.env.OPENAI_API_KEY ? "OK" : "MISSING"
);

// ============================
// BOT INIT
// ============================
const bot = new Telegraf(process.env.BOT_TOKEN);

// ============================
// IN-MEMORY GAME STATE
// ============================
const users = new Map();
// userId -> { stars, lastClick, clicksInWindow, windowStart }

// ============================
// HELPER: SAFE REPLY
// ============================
function safeReply(ctx, text) {
  const MAX = 4000;
  if (!text) return;
  if (text.length <= MAX) return ctx.reply(text);

  for (let i = 0; i < text.length; i += MAX) {
    ctx.reply(text.slice(i, i + MAX));
  }
}

// ============================
// /start
// ============================
bot.start((ctx) => {
  ctx.reply(
    "⭐ Welcome to Stars TON Clicker!\n\n" +
      "Use /play to start the game.\n" +
      "Use /dev for developer questions (admin only)."
  );
});

// ============================
// /play → WebApp
// ============================
bot.command("play", (ctx) => {
  ctx.reply("🎮 Start the Clicker", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Start Clicker ⭐",
            web_app: {
              url: "https://stars-ton-clicker.vercel.app"
            }
          }
        ]
      ]
    }
  });
});

// ============================
// WEBAPP GAME AUTHORITY
// ============================
bot.on("web_app_data", (ctx) => {
  try {
    const userId = ctx.from.id;
    const data = JSON.parse(ctx.message.web_app_data.data);
    const now = Date.now();

    if (data.type !== "CLICK") return;

    // INIT USER
    if (!users.has(userId)) {
      users.set(userId, {
        stars: 0,
        lastClick: 0,
        clicksInWindow: 0,
        windowStart: now
      });
    }

    const user = users.get(userId);

    // ⏱ RATE LIMIT (200ms)
    if (now - user.lastClick < 200) return;
    user.lastClick = now;

    // ⛔ AUTO-CLICKER WINDOW (1s)
    if (now - user.windowStart > 1000) {
      user.windowStart = now;
      user.clicksInWindow = 0;
    }

    user.clicksInWindow++;
    if (user.clicksInWindow > 8) return;

    // ⭐ GAME LOGIC
    user.stars += 1;

    // OPTIONAL: nur gelegentlich antworten (Spam vermeiden)
    if (user.stars % 10 === 0) {
      ctx.reply(`⭐ Stars: ${user.stars}`);
    }
  } catch (err) {
    console.error("❌ WEBAPP ERROR", err);
  }
});

// ============================
// /dev — KI DEV ASSISTANT
// ============================
bot.command("dev", async (ctx) => {
  console.log("🧠 /dev command received");

  const question = ctx.message.text.replace("/dev", "").trim();

  if (!question) {
    return ctx.reply(
      "❓ Stelle eine Dev-Frage.\n\n" +
        "Beispiel:\n/dev Wie verhindere ich Cheating?"
    );
  }

  // 🔒 OPTIONAL: ADMIN ONLY
  if (process.env.ADMIN_ID) {
    if (String(ctx.from.id) !== String(process.env.ADMIN_ID)) {
      return ctx.reply("⛔ Kein Zugriff");
    }
  }

  await ctx.reply("🤖 Analysiere Projekt & Code...");
  ctx.sendChatAction("typing");

  try {
    const answer = await askDevAI(question);
    safeReply(ctx, answer);
  } catch (err) {
    console.error("❌ DEV AI ERROR", err);
    ctx.reply("⚠️ Fehler bei der KI-Anfrage (siehe Logs)");
  }
});

// ============================
// GLOBAL ERROR HANDLER
// ============================
bot.catch((err, ctx) => {
  console.error("🔥 BOT ERROR", err);
});

// ============================
// BOT START
// ============================
bot.launch().then(() => {
  console.log("✅ Bot läuft");
});

// ============================
// GRACEFUL SHUTDOWN (Render)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

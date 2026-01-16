import { Telegraf } from "telegraf";
import { askDevAIHF as askDevAI } from "./dev-ai-hf-auto.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.BOT_TOKEN) throw new Error("❌ BOT_TOKEN fehlt");
if (!process.env.HF_API_KEY) throw new Error("❌ HF_API_KEY fehlt");

const bot = new Telegraf(process.env.BOT_TOKEN);
const users = new Map();

function safeReply(ctx, text) {
  const MAX = 4000;
  if (!text) return;
  if (text.length <= MAX) return ctx.reply(text);
  for (let i = 0; i < text.length; i += MAX) ctx.reply(text.slice(i, i + MAX));
}

bot.start((ctx) => {
  ctx.reply(
    "⭐ Welcome to Stars TON Clicker!\n\n" +
      "Use /play to start the game.\n" +
      "Use /dev for developer questions (admin only)."
  );
});

bot.command("play", (ctx) => {
  ctx.reply("🎮 Start the Clicker", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Start Clicker ⭐", web_app: { url: "https://stars-ton-clicker.vercel.app" } }
        ]
      ]
    }
  });
});

bot.on("web_app_data", (ctx) => {
  try {
    const userId = ctx.from.id;
    const data = JSON.parse(ctx.message.web_app_data.data);
    const now = Date.now();
    if (data.type !== "CLICK") return;

    if (!users.has(userId)) users.set(userId, { stars: 0, lastClick: 0, clicksInWindow: 0, windowStart: now });
    const user = users.get(userId);

    if (now - user.lastClick < 200) return;
    user.lastClick = now;

    if (now - user.windowStart > 1000) { user.windowStart = now; user.clicksInWindow = 0; }
    user.clicksInWindow++;
    if (user.clicksInWindow > 8) return;

    user.stars += 1;
    if (user.stars % 10 === 0) ctx.reply(`⭐ Stars: ${user.stars}`);
  } catch (err) {
    console.error("❌ WEBAPP ERROR", err);
  }
});

bot.command("dev", async (ctx) => {
  console.log("🧠 /dev command received");
  const question = ctx.message.text.replace("/dev", "").trim();
  if (!question) return ctx.reply("❓ Bitte eine Frage eingeben");

  if (process.env.ADMIN_ID && String(ctx.from.id) !== String(process.env.ADMIN_ID)) return ctx.reply("⛔ Kein Zugriff");

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

bot.catch((err) => console.error("🔥 BOT ERROR", err));

bot.launch().then(() => console.log("✅ Bot läuft"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
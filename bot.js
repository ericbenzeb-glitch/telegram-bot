import { Telegraf, Markup } from "telegraf";
import { askDevAIHF as askDevAI } from "./dev-ai-hf-auto.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.BOT_TOKEN) throw new Error("❌ BOT_TOKEN fehlt");
if (!process.env.HF_API_KEY) throw new Error("❌ HF_API_KEY fehlt");

const bot = new Telegraf(process.env.BOT_TOKEN);
const users = new Map();

// ============================
// HELPER: Safe Reply
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
// START / MENU
// ============================
bot.start((ctx) => {
  ctx.reply(
    "⭐ Welcome to Stars & TON Clicker Bot!\n\n" +
      "Use the buttons below to play or access developer tools.",
    Markup.inlineKeyboard([
      [Markup.button.webApp("Play Clicker ⭐", "https://stars-ton-clicker.vercel.app")],
      [Markup.button.callback("View Stars ✨", "view_stars")],
      [Markup.button.callback("Dev Command 🧠", "dev_info")]
    ])
  );
});

// ============================
// VIEW STARS
// ============================
bot.action("view_stars", (ctx) => {
  const userId = ctx.from.id;
  const stars = users.get(userId)?.stars || 0;
  ctx.answerCbQuery(`⭐ Stars: ${stars}`, { show_alert: true });
});

// ============================
// DEV INFO BUTTON
// ============================
bot.action("dev_info", (ctx) => {
  ctx.answerCbQuery("Use /dev <question> to ask the developer assistant", { show_alert: true });
});

// ============================
// WEBAPP CLICKER
// ============================
bot.on("web_app_data", (ctx) => {
  try {
    const userId = ctx.from.id;
    const data = JSON.parse(ctx.message.web_app_data.data);
    const now = Date.now();
    if (data.type !== "CLICK") return;

    if (!users.has(userId)) users.set(userId, { stars: 0, lastClick: 0, clicksInWindow: 0, windowStart: now });
    const user = users.get(userId);

    // Rate-limit: 200ms
    if (now - user.lastClick < 200) return;
    user.lastClick = now;

    // Anti-cheat window: 1s max 8 clicks
    if (now - user.windowStart > 1000) { user.windowStart = now; user.clicksInWindow = 0; }
    user.clicksInWindow++;
    if (user.clicksInWindow > 8) return;

    // Add stars
    user.stars += 1;

    // Notify every 10 stars
    if (user.stars % 10 === 0) ctx.reply(`⭐ Stars: ${user.stars}`);
  } catch (err) {
    console.error("❌ WEBAPP ERROR", err);
  }
});

// ============================
// /dev - HuggingFace AI
// ============================
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

// ============================
// GLOBAL ERROR HANDLER
// ============================
bot.catch((err) => console.error("🔥 BOT ERROR", err));

// ============================
// LAUNCH BOT
// ============================
bot.launch().then(() => console.log("✅ Bot läuft"));

// ============================
// GRACEFUL SHUTDOWN (Render)
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
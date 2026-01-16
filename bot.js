import { Telegraf, Markup } from "telegraf";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();
app.use(bodyParser.json());

/* =========================
   IN-MEMORY STATE
========================= */

const users = {}; // userId -> data

function getUser(id) {
  if (!users[id]) {
    users[id] = {
      stars: 0,
      lastClick: 0,
      lastDaily: 0,
      refBy: null,
      referrals: 0
    };
  }
  return users[id];
}

/* =========================
   TELEGRAM START / REFERRAL
========================= */

bot.start(ctx => {
  ctx.reply(
    "✨ Stars & TON Clicker",
    Markup.inlineKeyboard([
      [
        {
          text: "🎮 Spielen",
          web_app: {
            url: process.env.WEBAPP_URL
          }
        }
      ],
      [
        Markup.button.callback("🎁 Tagesbonus", "DAILY"),
        Markup.button.callback("📊 Stats", "STATS")
      ],
      [
        Markup.button.callback("👥 Referral-Link", "REF")
      ]
    ])
  );
});
bot.start(ctx => {
  ctx.reply(
    "✨ Stars & TON Clicker",
    Markup.inlineKeyboard([
      [
        {
          text: "🎮 Spielen",
          web_app: {
            url: process.env.WEBAPP_URL
          }
        }
      ],
      [
        Markup.button.callback("🎁 Tagesbonus", "DAILY"),
        Markup.button.callback("📊 Stats", "STATS")
      ],
      [
        Markup.button.callback("👥 Referral-Link", "REF")
      ]
    ])
  );
});

/* =========================
   CALLBACK BUTTONS
========================= */

bot.action("DAILY", ctx => {
  const u = getUser(ctx.from.id);
  const today = Math.floor(Date.now() / 86400000);

  if (u.lastDaily === today) {
    return ctx.answerCbQuery("Heute schon abgeholt ❌", { show_alert: true });
  }

  u.lastDaily = today;
  u.stars += 10;

  ctx.answerCbQuery("🎁 +10 Stars!", { show_alert: true });
});

bot.action("REF", ctx => {
  const link = `https://t.me/${ctx.me}?start=ref_${ctx.from.id}`;
  ctx.reply(
    `👥 Dein Referral-Link:\n${link}\n\n+5 ⭐ pro Freund`
  );
});

bot.action("STATS", ctx => {
  const u = getUser(ctx.from.id);
  ctx.reply(
    `📊 Deine Stats:\n\n⭐ Stars: ${u.stars}\n👥 Referrals: ${u.referrals}`
  );
});

/* =========================
   WEBAPP DATA (KLICKS)
========================= */

bot.on("web_app_data", ctx => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    const u = getUser(ctx.from.id);
    const now = Date.now();

    if (data.type === "CLICK") {
      // Anti-Spam: max 5 Klicks / Sek
      if (now - u.lastClick < 200) return;
      u.lastClick = now;

      const value = Math.min(Number(data.value || 1), 10);
      u.stars += value;

      ctx.reply(`⭐ +${value} | Total: ${u.stars}`);
    }
  } catch (e) {
    console.error("WEBAPP DATA ERROR", e);
  }
});

/* =========================
   OPTIONAL BACKEND ENDPOINT
========================= */

app.post("/webapp", (req, res) => {
  // optional – aktuell nicht zwingend nötig
  res.json({ ok: true });
});

/* =========================
   START
========================= */

bot.launch();
app.listen(process.env.PORT || 3000, () =>
  console.log("🚀 Bot + WebApp Backend läuft")
);

/* =========================
   GRACEFUL STOP
========================= */

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
import { Telegraf, Markup } from "telegraf";
import dotenv from "dotenv";
import { getUser, addToLeaderboard, leaderboard } from "./state.js";

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

// ================= START / REFERRAL =================
bot.start(ctx => {
  const userId = ctx.from.id;
  const payload = ctx.startPayload;
  const user = getUser(userId);

  if (payload && payload !== String(userId) && !user.referredBy) {
    const referrer = getUser(payload);
    referrer.stars += 5;
    user.stars += 5;
    user.referredBy = payload;
    ctx.reply("🎉 Referral Bonus! +5 Stars");
  }

  ctx.reply(
    "⭐ Stars & TON Clicker",
    Markup.inlineKeyboard([
      [Markup.button.webApp("Play ⭐", "https://stars-ton-clicker.vercel.app")],
      [Markup.button.callback("Stars ✨", "stars")],
      [Markup.button.callback("Daily 🎁", "daily")],
      [Markup.button.callback("Referral 👥", "ref")],
      [Markup.button.callback("Leaderboard 🏆", "lb")],
      [Markup.button.callback("Redeem TON 💎", "redeem")]
    ])
  );
});

// ================= BUTTONS =================
bot.action("stars", ctx => {
  ctx.answerCbQuery(`⭐ ${getUser(ctx.from.id).stars}`, { show_alert:true });
});

bot.action("daily", ctx => {
  const u = getUser(ctx.from.id);
  const now = Date.now();
  if (now - u.lastDaily < 86400000)
    return ctx.answerCbQuery("⏳ Morgen wieder", {show_alert:true});
  u.lastDaily = now;
  u.stars += 10;
  ctx.answerCbQuery("🎁 +10 Stars", {show_alert:true});
});

bot.action("ref", ctx => {
  const link = `https://t.me/${ctx.botInfo.username}?start=${ctx.from.id}`;
  ctx.answerCbQuery(link, {show_alert:true});
});

bot.action("lb", ctx => {
  if (!leaderboard.length)
    return ctx.answerCbQuery("Noch leer", {show_alert:true});
  const text = leaderboard.map((e,i)=>`${i+1}. ${e.stars} ⭐`).join("\n");
  ctx.reply("🏆 Leaderboard\n"+text);
});

bot.action("redeem", ctx => {
  const u = getUser(ctx.from.id);
  if (u.stars < 100)
    return ctx.answerCbQuery("Mind. 100 Stars nötig", {show_alert:true});
  u.stars -= 100;
  ctx.reply("💎 Redeem vorgemerkt (TON Wallet kommt)");
});

// ================= WEBAPP SYNC =================
bot.on("web_app_data", ctx => {
  const data = JSON.parse(ctx.message.web_app_data.data);
  const u = getUser(ctx.from.id);
  const now = Date.now();

  if (data.type === "CLICK") {
    if (now - u.lastClick < 200) return;
    u.lastClick = now;
    u.stars++;
    addToLeaderboard(ctx.from.id, u.stars);
    ctx.reply(`⭐ ${u.stars}`);
  }
});

// ================= RUN =================
bot.launch();
process.once("SIGINT", ()=>bot.stop());
process.once("SIGTERM", ()=>bot.stop());
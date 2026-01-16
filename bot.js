import { Bot, InlineKeyboard } from 'grammy';
import { BOT_TOKEN, BOT_USERNAME } from './config.js';
import { loadUsers, getUser, saveUsers } from './database.js';
import callbackHandler from './handlers/callbacks.js';
import startHandler from './handlers/start.js';
import menuKeyboard from './handlers/menu.js';

await loadUsers();

const bot = new Bot(BOT_TOKEN);

bot.command("dev", (ctx) => {
  console.log("DEV COMMAND TRIGGERED");
  ctx.reply("✅ /dev angekommen");
});

bot.use(async (ctx, next) => {
  // make users accessible in handlers via ctx.users
  ctx.users = (await import('./database.js')).getAllUsers?.() || {};
  return next();
});

bot.command(['start', 'menu'], startHandler);
bot.on('callback_query:data', callbackHandler);

import { askDevAI } from "./dev-ai.js";

bot.command("dev", async (ctx) => {
  const question = ctx.message.text.replace("/dev", "").trim();

  if (!question) {
    return ctx.reply("❓ Stelle mir eine Dev-Frage.\nBeispiel:\n/dev Wie verhindere ich Cheating?");
  }

  // 🔒 Optional: Nur für dich erlauben
  // if (ctx.from.id !== 2041130393) return;

  await ctx.reply("🤖 Denke nach...");

  try {
    const answer = await askDevAI(question);
    ctx.reply(answer);
  } catch (err) {
    console.error(err);
    ctx.reply("⚠️ Fehler bei der KI-Anfrage.");
  }
});
// optional: keep existing web_app_data handler for direct WebApp messages
bot.on('message:web_app_data', async (ctx) => {
  try {
    const userId = ctx.from.id.toString();
    const user = getUser(userId);
    const raw = ctx.message.web_app_data.data;
    let data;
    try { data = JSON.parse(raw); } catch { return ctx.reply('Ungültige WebApp-Daten.'); }

    const score = Number(data.score ?? 0);
    const ts = Number(data.ts ?? 0);
    if (!Number.isFinite(score) || score < 0) return ctx.reply('Ungültiger Score.');
    if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) return ctx.reply('Daten zu alt oder manipuliert.');

    const reward = Math.floor(score / 100);
    if (reward <= 0) return ctx.reply('Zu wenig Score für eine Belohnung.');

    user.balance += reward;
    await saveUsers();
    await ctx.reply(`🎮 Score: ${score}\n💰 Belohnung: +${reward} Punkte\nNeue Balance: ${user.balance}`);
  } catch (err) {
    console.error('Fehler bei WebApp message handler', err);
  }
});

bot.start({
  onStart: (info) => console.log(`Bot gestartet: @${info.username}`)
});

bot.catch((err) => console.error('Bot-Fehler:', err));

export default bot;

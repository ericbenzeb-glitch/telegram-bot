import { getUser, saveUsers } from '../database.js';
import { getTodayUTC } from '../utils/time.js';
import { BOT_USERNAME } from '../config.js';

export default async function callbackHandler(ctx) {
  const userId = ctx.from.id.toString();
  const user = getUser(userId);
  const data = ctx.callbackQuery.data;

  try { await ctx.answerCallbackQuery(); } catch {}

  switch (data) {
    case 'show_balance':
      return ctx.reply(`Deine Balance: ${user.balance} Punkte`);
    case 'show_stats':
      return ctx.reply(`Stats:\nReferrals: ${user.referralCount}\nStreak: ${user.dailyStreak}`);
    case 'daily_reward': {
      const today = getTodayUTC();
      if (user.lastDaily === today) return ctx.reply('Heute schon abgeholt!');
      user.lastDaily = today;
      user.dailyStreak += 1;
      user.balance += 1;
      await saveUsers();
      return ctx.reply(`+1 Punkt! Streak: ${user.dailyStreak}`);
    }
    case 'show_tasks':
      return ctx.reply('Aufgaben kommen bald...');
    case 'get_referral':
      return ctx.reply(`Dein Link: https://t.me/${BOT_USERNAME}?start=ref_${userId}`);
    case 'withdraw':
      return ctx.reply('Auszahlung kommt bald!');
    default:
      return ctx.reply('Unbekannte Aktion');
  }
}

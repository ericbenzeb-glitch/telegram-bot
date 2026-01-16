import { getUser, saveUsers } from '../database.js';
import menuKeyboard from './menu.js';

export default async function startHandler(ctx) {
  const userId = ctx.from.id.toString();
  const user = getUser(userId);

  const text = ctx.message?.text ?? '';

  if (text.startsWith('/start ref_')) {
    const refId = text.split('ref_')[1];
    if (/^\d+$/.test(refId) && refId !== userId && ctx.users[refId] && user.referredBy === null) {
      user.referredBy = refId;
      ctx.users[refId].balance += 1;
      ctx.users[refId].referralCount += 1;
      try { await ctx.api.sendMessage(refId, '🎉 Neuer Referral! +1 Point'); } catch {}
      await saveUsers();
    }
  }

  await ctx.reply('Willkommen beim StarsTonBot 🚀', { reply_markup: menuKeyboard });
}

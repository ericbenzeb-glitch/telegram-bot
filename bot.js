import { Bot, InlineKeyboard } from 'grammy';
import { config } from 'dotenv';
import fs from 'fs/promises';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';

config();

const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
const BOT_USERNAME = process.env.BOT_USERNAME?.trim();
const TON_SEED = process.env.TON_SEED?.trim();
const USE_TESTNET = process.env.USE_TESTNET === 'true';

if (!BOT_TOKEN || !BOT_USERNAME || !TON_SEED) {
  console.error('Fehlende ENV Variablen');
  process.exit(1);
}

const endpoint = USE_TESTNET
  ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
  : 'https://toncenter.com/api/v2/jsonRPC';

const client = new TonClient({ endpoint });

let wallet = null;
async function getWallet() {
  if (!wallet) {
    const keyPair = await mnemonicToPrivateKey(TON_SEED.split(' '));
    wallet = client.open(WalletContractV4.create({ workchain: 0, publicKey: keyPair.publicKey }));
  }
  return wallet;
}

const USERS_FILE = './users.json';
let users = {};

async function loadUsers() {
  try {
    users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    console.log(`Users geladen: ${Object.keys(users).length}`);
  } catch {
    users = {};
    console.log('users.json neu erstellt');
  }
}

async function saveUsers() {
  const tmp = USERS_FILE + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(users, null, 2));
  await fs.rename(tmp, USERS_FILE);
}

setInterval(() => saveUsers().catch(console.error), 30000);

const bot = new Bot(BOT_TOKEN);

await loadUsers();

/* === KORREKTES MENÜ mit WebApp-Button === */
const menuKeyboard = new InlineKeyboard()
  .webApp('🎮 Clicker Game spielen!', 'https://stars-ton-clicker.vercel.app') // ← Deine funktionierende URL!
  .row()
  .text('💰 Balance', 'show_balance')
  .text('📊 Stats', 'show_stats')
  .row()
  .text('🎁 Daily Reward', 'daily_reward')
  .row()
  .text('📋 Aufgaben', 'show_tasks')
  .text('🔗 Referral-Link', 'get_referral')
  .row()
  .text('💸 Withdraw', 'withdraw');

/* ================== COMMANDS ================== */
bot.command(['start', 'menu'], async (ctx) => {
  const userId = ctx.from.id.toString();

  if (!users[userId]) {
    users[userId] = { balance: 0, referralCount: 0, referredBy: null, dailyStreak: 0, lastDaily: 0, lastAdReward: 0 };
    await saveUsers();
  }

  const text = ctx.message.text || '';
  if (text.startsWith('/start ref_')) {
    const refId = text.split('ref_')[1];
    if (refId && refId !== userId && !users[userId].referredBy && users[refId]) {
      users[userId].referredBy = refId;
      users[refId].balance += 1;
      users[refId].referralCount += 1;
      await ctx.api.sendMessage(refId, '🎉 Neuer Referral! +1 Point');
      await saveUsers();
    }
  }

  await ctx.reply('Willkommen beim StarsTonBot 🚀', { reply_markup: menuKeyboard });
});

/* ================== ALLE CALLBACKS REGISTRIEREN ================== */
bot.on('callback_query:data', async (ctx) => {
  const userId = ctx.from.id.toString();
  const user = users[userId] || { balance: 0, referralCount: 0, dailyStreak: 0 };
  const data = ctx.callbackQuery.data;

  await ctx.answerCallbackQuery();

  switch (data) {
    case 'show_balance':
      await ctx.reply(`Deine Balance: ${user.balance} Punkte`);
      break;
    case 'show_stats':
      await ctx.reply(`Stats:\nReferrals: ${user.referralCount}\nStreak: ${user.dailyStreak}`);
      break;
    case 'daily_reward':
      const now = Date.now();
      const today = Math.floor(now / 86400000) * 86400000;
      if (user.lastDaily >= today) {
        await ctx.reply('Heute schon abgeholt!');
      } else {
        user.lastDaily = today;
        user.dailyStreak += 1;
        user.balance += 1;
        await saveUsers();
        await ctx.reply(`+1 Punkt! Streak: ${user.dailyStreak}`);
      }
      break;
    case 'show_tasks':
      await ctx.reply('Aufgaben kommen bald...');
      break;
    case 'get_referral':
      await ctx.reply(`Dein Link: https://t.me/${BOT_USERNAME}?start=ref_${userId}`);
      break;
    case 'withdraw':
      await ctx.reply('Auszahlung kommt bald!');
      break;
    default:
      await ctx.reply('Unbekannte Aktion');
  }
});

/* ================== ERROR-HANDLING & START ================== */
console.log('Bot wird gestartet...');

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot erfolgreich gestartet! @${botInfo.username}`);
  },
});

bot.catch((err) => {
  console.error('Fehler im Bot:', err);
});

import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import { BOT_TOKEN } from './config.js';
import { getUser, saveUsers } from './database.js';
import { Bot } from 'grammy';

const app = express();
app.use(bodyParser.json({ limit: '128kb' }));

const bot = new Bot(BOT_TOKEN);

// Validate Telegram WebApp initData according to Telegram docs
function validateInitData(initData) {
  if (!initData || typeof initData !== 'string') return false;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k === 'hash') continue;
    entries.push(`${k}=${v}`);
  }
  entries.sort();
  const dataCheckString = entries.join('\n');

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return hmac === hash;
}

function parseInitDataUser(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

app.post('/webapp', async (req, res) => {
  try {
    const { initData, payload } = req.body;
    if (!initData || !payload) return res.status(400).json({ error: 'Missing initData or payload' });

    if (!validateInitData(initData)) {
      return res.status(403).json({ error: 'Invalid initData signature' });
    }

    const userObj = parseInitDataUser(initData);
    if (!userObj || !userObj.id) return res.status(400).json({ error: 'User not found in initData' });

    const uid = userObj.id.toString();
    const user = getUser(uid);

    const score = Number(payload.score ?? 0);
    const ts = Number(payload.ts ?? 0);
    if (!Number.isFinite(score) || score < 0) return res.status(400).json({ error: 'Invalid score' });

    if (Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
      return res.status(400).json({ error: 'Payload timestamp invalid' });
    }

    const reward = Math.floor(score / 100);
    if (reward <= 0) {
      return res.status(200).json({ reward: 0, message: 'Zu wenig Score' });
    }

    user.balance += reward;
    await saveUsers();

    try {
      await bot.api.sendMessage(uid, `🎮 WebApp Score: ${score}\n💰 Belohnung: +${reward} Punkte\nNeue Balance: ${user.balance}`);
    } catch (e) {
      console.warn('Konnte User Nachricht nicht senden', e);
    }

    return res.status(200).json({ reward });
  } catch (err) {
    console.error('WebApp endpoint error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default app;

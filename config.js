import { config } from 'dotenv';
config();

export const BOT_TOKEN = process.env.BOT_TOKEN?.trim();
export const BOT_USERNAME = process.env.BOT_USERNAME?.trim();
export const TON_SEED = process.env.TON_SEED?.trim();
export const USE_TESTNET = process.env.USE_TESTNET === 'true';
export const WEBAPP_BACKEND_ORIGIN = process.env.WEBAPP_BACKEND_ORIGIN?.replace(/\/$/, '') || '';

if (!BOT_TOKEN || !BOT_USERNAME) {
  console.error('Fehlende ENV Variablen BOT_TOKEN oder BOT_USERNAME');
  process.exit(1);
}

export const TON_ENDPOINT = USE_TESTNET
  ? 'https://testnet.toncenter.com/api/v2/jsonRPC'
  : 'https://toncenter.com/api/v2/jsonRPC';

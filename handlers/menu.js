import { InlineKeyboard } from 'grammy';
import { BOT_USERNAME } from '../config.js';

const menuKeyboard = new InlineKeyboard()
  .webApp('🎮 Clicker Game spielen!', 'https://stars-ton-clicker.vercel.app')
  .row()
  .text('💰 Kontostand', 'show_balance')
  .text('📊 Statistiken', 'show_stats')
  .row()
  .text('🎁 Tägliche Belohnung', 'daily_reward')
  .row()
  .text('📋 Aufgaben', 'show_tasks')
  .text('🔗 Referral-Link', 'get_referral')
  .row()
  .text('💸 Auszahlung', 'withdraw');

export default menuKeyboard;

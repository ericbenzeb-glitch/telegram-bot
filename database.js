import fs from 'fs/promises';
import path from 'path';

const FILE = path.resolve('./data/users.json');
let users = {};
let saving = false;

export async function loadUsers() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    users = JSON.parse(raw);
    console.log(`📁 Users geladen: ${Object.keys(users).length}`);
  } catch {
    users = {};
    await ensureDirAndWrite();
    console.log('📁 users.json neu erstellt');
  }
}

async function ensureDirAndWrite() {
  try {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(users, null, 2));
  } catch (e) {
    console.error('Fehler beim Erstellen der Datenbankdatei', e);
  }
}

export function getUser(id) {
  if (!users[id]) {
    users[id] = {
      balance: 0,
      referralCount: 0,
      referredBy: null,
      dailyStreak: 0,
      lastDaily: 0,
      lastAdReward: 0
    };
  }
  return users[id];
}

export async function saveUsers() {
  if (saving) return;
  saving = true;
  try {
    const tmp = FILE + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(users, null, 2));
    await fs.rename(tmp, FILE);
  } catch (e) {
    console.error('Fehler beim Speichern der Users', e);
  } finally {
    saving = false;
  }
}

export function getAllUsers() {
  return users;
}

setInterval(() => saveUsers().catch(console.error), 30000);

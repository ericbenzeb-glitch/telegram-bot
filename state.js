export const users = new Map();
export const leaderboard = [];

export function getUser(id) {
  if (!users.has(id)) {
    users.set(id, {
      stars: 0,
      lastClick: 0,
      clicksInWindow: 0,
      windowStart: Date.now(),
      lastDaily: 0,
      referredBy: null
    });
  }
  return users.get(id);
}

export function addToLeaderboard(userId, stars) {
  leaderboard.push({ userId, stars, ts: Date.now() });
  leaderboard.sort((a,b)=>b.stars-a.stars);
  leaderboard.splice(10);
}
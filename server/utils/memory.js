// server/utils/memory.js

export const mem = {
  players: new Map(),
  weeklyStreaks: new Map(),
};

export const TIER_INFO = {
  rookie: { cash: 12.99, vault: 10, payout: 2 },
  pro:    { cash: 17.99, vault: 15, payout: 3 },
  elite:  { cash: 22.99, vault: 20, payout: 4 },
};

export function ensureProfile(uid) {
  if (!mem.players.has(uid)) {
    mem.players.set(uid, {
      userId: uid,
      username: "Player",
      email: "test@example.com",

      tier: "rookie",
      matchesRemaining: 10,
      payoutPerWin: 2,

      vault: 0,
      lifetimeEarnings: 0,

      lifetimeWins: 0,
      lifetimeLosses: 0,
      winRate: 0,
      longestStreak: 0,
      currentStreak: 0,

      recentMatches: [],
    });
  }
  return mem.players.get(uid);
}

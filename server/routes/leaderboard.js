// server/routes/leaderboard.js
import express from "express";
import { mem } from "../utils/memory.js";
import { currentWeekKey } from "../utils/weekKey.js";

const router = express.Router();

// /lsw/leaderboard
router.get("/lsw/leaderboard", (req, res) => {
  const weekKey = currentWeekKey();

  const all = Array.from(mem.weeklyStreaks.values())
    .filter((v) => v.weekKey === weekKey)
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 5);

  res.json({ weekKey, top5: all });
});

// /dev/longest-streak
router.get("/dev/longest-streak", (req, res) => {
  const weekKey = currentWeekKey();

  const all = Array.from(mem.weeklyStreaks.values())
    .filter((v) => v.weekKey === weekKey)
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 5);

  if (!all.length) {
    return res.json({
      streaks: [
        { rank: 1, name: "NeonNinja", wins: 18 },
        { rank: 2, name: "RPSKing", wins: 15 },
        { rank: 3, name: "PaperTiger", wins: 13 },
        { rank: 4, name: "ScissorQueen", wins: 11 },
        { rank: 5, name: "VaultCrusher", wins: 10 },
      ],
    });
  }

  const formatted = all.map((row, index) => ({
    rank: index + 1,
    name: row.username || "Player",
    wins: row.bestStreak,
  }));

  res.json({ streaks: formatted });
});

export default router;

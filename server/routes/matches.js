// server/routes/matches.js
import express from "express";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../firebaseAdmin.js";
import { requireAuth } from "../utils/auth.js";
import { ensureProfile, mem } from "../utils/memory.js";
import { currentWeekKey } from "../utils/weekKey.js";

const router = express.Router();

// /match-result
router.post("/match-result", requireAuth, async (req, res) => {
  const uid = req.user.uid;
  const p = ensureProfile(uid);

  const { outcome, opponent } = req.body;

  if (!["win", "loss"].includes(outcome)) {
    return res.status(400).json({ error: "Invalid outcome" });
  }

  if (p.matchesRemaining > 0) {
    p.matchesRemaining -= 1;
  }

  let earned = 0;
  let weekKey = null;

  if (outcome === "win") {
    p.lifetimeWins++;
    p.currentStreak++;

    earned = p.payoutPerWin;
    p.vault += earned;
    p.lifetimeEarnings += earned;

    if (p.currentStreak > p.longestStreak) {
      p.longestStreak = p.currentStreak;
    }

    weekKey = currentWeekKey();

    mem.weeklyStreaks.set(`${weekKey}:${uid}`, {
      userId: uid,
      username: p.username,
      bestStreak: p.currentStreak,
      weekKey,
      updatedAt: Date.now(),
    });
  } else {
    p.lifetimeLosses++;
    p.currentStreak = 0;
  }

  const total = p.lifetimeWins + p.lifetimeLosses;
  p.winRate = total ? Math.round((p.lifetimeWins / total) * 100) : 0;

  p.recentMatches = [
    ...p.recentMatches,
    {
      result: outcome === "win" ? "W" : "L",
      opponent: opponent || null,
      payout: earned,
    },
  ].slice(-10);

  mem.players.set(uid, p);

  try {
    const ref = db.collection("players").doc(uid);
    await ref.set(p, { merge: true });

    if (weekKey) {
      const streakRef = db
        .collection("weeklyStreaks")
        .doc(`${weekKey}:${uid}`);
      await streakRef.set(
        {
          userId: uid,
          username: p.username,
          bestStreak: p.currentStreak,
          weekKey,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (err) {
    console.error("🔥 Firestore sync error:", err);
  }

  res.json(p);
});

export default router;

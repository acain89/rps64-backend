// server/routes/profile.js
import express from "express";
import { db } from "../firebaseAdmin.js";
import { requireAuth } from "../utils/auth.js";
import { ensureProfile, mem } from "../utils/memory.js";

const router = express.Router();

// /profile — summarized profile for UI
router.get("/profile", requireAuth, async (req, res) => {
  const uid = req.user.uid;

  try {
    const snap = await db.collection("players").doc(uid).get();

    let p;
    if (snap.exists) {
      p = snap.data();
      mem.players.set(uid, p);
    } else {
      p = ensureProfile(uid);
      await db.collection("players").doc(uid).set(p);
    }

    res.json({
      ok: true,
      username: p.username,
      tier: p.tier,
      matchesRemaining: p.matchesRemaining,
      payoutPerWin: p.payoutPerWin,
      vault: p.vault,
      lifetimeWins: p.lifetimeWins,
      lifetimeLosses: p.lifetimeLosses,
      winRate: p.winRate,
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      lifetimeEarnings: p.lifetimeEarnings,
      recentMatches: p.recentMatches || [],
    });
  } catch (err) {
    console.error("🔥 /profile error:", err);
    res.json(ensureProfile(uid));
  }
});

// /player/profile — raw profile doc
router.get("/player/profile", requireAuth, async (req, res) => {
  const uid = req.user.uid;

  try {
    const ref = db.collection("players").doc(uid);
    const snap = await ref.get();

    if (snap.exists) {
      const p = snap.data();
      mem.players.set(uid, p);
      return res.json(p);
    }

    const p = ensureProfile(uid);
    await ref.set(p);
    return res.json(p);
  } catch (err) {
    console.error("🔥 /player/profile Firestore error:", err);
    return res.json(ensureProfile(uid));
  }
});

export default router;

// server/routes/passes.js
import express from "express";
import { db } from "../firebaseAdmin.js";
import { requireAuth } from "../utils/auth.js";
import { ensureProfile, mem, TIER_INFO } from "../utils/memory.js";

const router = express.Router();

// /player/rebuy
router.post("/player/rebuy", requireAuth, async (req, res) => {
  const uid = req.user.uid;

  let p;
  const ref = db.collection("players").doc(uid);
  const snap = await ref.get();

  if (snap.exists) {
    p = snap.data();
  } else {
    p = ensureProfile(uid);
    await ref.set(p);
  }

  const { method } = req.body;
  const tier = p.tier;
  const t = TIER_INFO[tier];

  if (!t) return res.status(400).json({ error: "Invalid tier" });

  if (method === "vault") {
    if (p.vault < t.vault) {
      return res.status(400).json({ error: "Not enough vault funds" });
    }
    p.vault -= t.vault;
  }

  if (method === "card") {
    console.log(`Simulated card charge $${t.cash}`);
  }

  p.matchesRemaining = 10;
  p.payoutPerWin = t.payout;
  p.recentMatches = [];

  await ref.set(p, { merge: true });
  mem.players.set(uid, p);

  res.json(p);
});

export default router;

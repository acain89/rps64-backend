// server/routes/cashout.js
import express from "express";
import { requireAuth } from "../utils/auth.js";
import { ensureProfile, mem } from "../utils/memory.js";

const router = express.Router();

// /player/cashout (still simulated for now)
router.post("/player/cashout", requireAuth, (req, res) => {
  const uid = req.user.uid;
  const p = ensureProfile(uid);

  if (p.vault < 50) {
    return res
      .status(400)
      .json({ error: "Vault must be $50+ to cash out" });
  }

  console.log(`Simulated cashout: $${p.vault}`);
  p.vault = 0;

  mem.players.set(uid, p);
  res.json(p);
});

export default router;

// server/routes/stripe.js
import express from "express";
import { stripe } from "../services/stripe.js";
import { db } from "../firebaseAdmin.js";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "../utils/auth.js";
import { ensureProfile, mem, TIER_INFO } from "../utils/memory.js";

const router = express.Router();

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

// ------------------------------------------------------------
// /api/create-checkout-session
// ------------------------------------------------------------
router.post("/create-checkout-session", requireAuth, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { tier } = req.body;

    const PRICE_IDS = {
      rookie: process.env.PRICE_ROOKIE,
      pro: process.env.PRICE_PRO,
      elite: process.env.PRICE_ELITE,
    };

    if (!PRICE_IDS[tier]) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PRICE_IDS[tier],
          quantity: 1,
        },
      ],
      success_url: `${FRONTEND}/purchase-success`,
      cancel_url: `${FRONTEND}/purchase-cancelled`,
      metadata: { uid, tier },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("🔥 Stripe session error:", err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// ------------------------------------------------------------
// Webhook handler (used directly in server.js)
// ------------------------------------------------------------
export async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const uid = session.metadata?.uid;
      const tier = session.metadata?.tier;

      console.log("🟢 Checkout completed for UID:", uid);
      console.log("   Tier purchased:", tier);
      console.log("   Session ID:", session.id);

      if (!uid || !tier) {
        console.log("❌ Missing metadata — cannot activate pass.");
        break;
      }

      try {
        const ref = db.collection("players").doc(uid);
        const snap = await ref.get();

        let p;
        if (snap.exists) {
          p = snap.data();
        } else {
          p = ensureProfile(uid);
          await ref.set(p);
        }

        const t = TIER_INFO[tier];
        if (!t) {
          console.log("❌ Invalid tier in Stripe metadata:", tier);
          break;
        }

        p.tier = tier;
        p.matchesRemaining = 10;
        p.payoutPerWin = t.payout;
        p.recentMatches = [];

        await ref.set(p, { merge: true });
        mem.players.set(uid, p);

        console.log("✅ Pass activated for UID:", uid, "Tier:", tier);
      } catch (err) {
        console.error("🔥 Error activating pass:", err);
      }

      break;
    }

    case "payment_intent.succeeded": {
      console.log("💰 Payment succeeded:", event.data.object.id);
      break;
    }

    case "charge.succeeded": {
      console.log("💵 Charge succeeded:", event.data.object.id);
      break;
    }

    case "payment_intent.payment_failed": {
      console.log("❌ Payment failed:", event.data.object.id);
      break;
    }

    default: {
      console.log("ℹ️ Unhandled event:", event.type);
      break;
    }
  }

  res.json({ received: true });
}

export default router;

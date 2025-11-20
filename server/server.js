// server/server.js
// ============================================================
// RPS64 Backend — Modularized, Auth-on, Stripe-ready
// ============================================================

import dotenv from "dotenv";
dotenv.config();
process.env.NODE_ENV = "development";

import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("Loaded STRIPE KEY:", process.env.STRIPE_SECRET_KEY);
console.log("DEBUG: STRIPE KEY =", process.env.STRIPE_SECRET_KEY);

import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";

import stripeRouter, { handleStripeWebhook } from "./routes/stripe.js";
import profileRoutes from "./routes/profile.js";
import passesRoutes from "./routes/passes.js";
import matchesRoutes from "./routes/matches.js";
import cashoutRoutes from "./routes/cashout.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import { requireAuth } from "./middleware/requireAuth.js";


const PORT = process.env.PORT || 10000;
const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5173";

// ============================================================
// INIT APP FIRST
// ============================================================
const app = express();

// ============================================================
// ALLOWED ORIGINS
// ============================================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://rps-frontend-74cb.onrender.com",
];

// ============================================================
// CORS — SINGLE CLEAN MIDDLEWARE
// ============================================================
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.log("❌ BLOCKED ORIGIN:", origin);
      return callback(new Error("CORS Not Allowed"), false);
    },
    credentials: true,
  })
);

// ============================================================
// STRIPE WEBHOOK — raw body FIRST
// ============================================================
app.post(
  "/api/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  handleStripeWebhook
);

// ============================================================
// NORMAL MIDDLEWARE
// ============================================================
app.use(express.json());
app.use(helmet());

// Dev CSP (relaxed)
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; connect-src *;"
  );
  next();
});

app.get("/secure-test", requireAuth, (req, res) => {
  res.json({ ok: true, uid: req.user.uid });
});
// ============================================================
// HEALTH
// ============================================================
app.get("/", (_, res) => {
  res.json({ ok: true, status: "Backend running (modular)" });
});

// ============================================================
// ROUTES
// ============================================================
app.use(profileRoutes);
app.use(passesRoutes);
app.use(matchesRoutes);
app.use(cashoutRoutes);
app.use(leaderboardRoutes);
app.use("/api", stripeRouter);

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log(`🚀 RPS64 Backend running on port ${PORT}`);
  console.log(`Frontend expected at: ${FRONTEND}`);
});

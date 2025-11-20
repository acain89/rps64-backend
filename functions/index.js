// functions/index.js

const admin = require("firebase-admin");
const { onSchedule } = require("firebase-functions/v2/scheduler");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Weekly prize reset
 *
 * Runs every Sunday at 8:00 PM CST.
 */
exports.weeklyPrizeReset = onSchedule(
  {
    schedule: "0 20 * * SUN", // 8:00 PM Sunday
    timeZone: "America/Chicago",
  },
  async () => {
    console.log("🔥 Running weeklyPrizeReset...");

    const prizeRef = db.collection("meta").doc("weeklyPrize");
    const snap = await prizeRef.get();

    if (!snap.exists) {
      console.warn("weeklyPrize doc missing — creating...");
      await prizeRef.set({
        amount: 0,
        weekStart: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }

    const data = snap.data();
    const currentAmount = data.amount || 0;

    console.log(
      `Current weekly prize was $${currentAmount.toFixed(
        2
      )}. Resetting to $0.00...`
    );

    await prizeRef.update({
      amount: 0,
      weekStart: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ weeklyPrize reset completed.");
    return null;
  }
);

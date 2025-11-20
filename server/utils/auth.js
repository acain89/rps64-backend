import admin from "firebase-admin";

export async function requireAuth(req, res, next) {
  // DEV MODE OVERRIDE (should be OFF now)
  if (process.env.USE_FAKE_BACKEND === "1") {
    req.user = { uid: req.headers["x-user-id"] || "dev-user" };
    return next();
  }

  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = { uid: decoded.uid };
    return next();
  } catch (err) {
    console.error("🔥 Invalid token:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

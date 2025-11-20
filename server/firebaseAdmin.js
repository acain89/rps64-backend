// firebaseAdmin.js
import admin from "firebase-admin";
import fs from "fs";

// Read service account JSON manually (Node 22-safe)
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("./firebasekey.json", import.meta.url))
);

// Fix newline formatting if needed
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
export { admin };

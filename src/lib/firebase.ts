import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth, type Auth } from "firebase-admin/auth";

/**
 * Admin SDK bootstrap. Credentials resolve in this order:
 *
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY — the service account JSON, inline, for
 *      local dev and any host that isn't Firebase/GCP itself.
 *   2. Application Default Credentials — automatic on Firebase App Hosting,
 *      Cloud Run and Cloud Functions. No env var needed there.
 *
 * FIREBASE_STORAGE_BUCKET must be set either way (Storage has no ADC-derived
 * default the way Firestore does).
 */
function buildApp(): App {
  if (getApps().length > 0) return getApps()[0]!;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const bucket = process.env.FIREBASE_STORAGE_BUCKET;
  if (!bucket) {
    throw new Error("FIREBASE_STORAGE_BUCKET is not set. See .env.example.");
  }

  if (key) {
    const serviceAccount = JSON.parse(key);
    return initializeApp({ credential: cert(serviceAccount), storageBucket: bucket });
  }

  // Application Default Credentials — present automatically on Firebase/GCP infra.
  return initializeApp({ storageBucket: bucket });
}

const globalForFirebase = globalThis as unknown as { __firebaseApp?: App };

function app(): App {
  if (!globalForFirebase.__firebaseApp) {
    globalForFirebase.__firebaseApp = buildApp();
  }
  return globalForFirebase.__firebaseApp;
}

export function db(): Firestore {
  return getFirestore(app());
}

export function bucket() {
  return getStorage(app()).bucket();
}

export function auth(): Auth {
  return getAuth(app());
}

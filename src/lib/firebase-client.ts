"use client";

import { initializeApp, getApps } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";

/**
 * Browser-side Firebase app, used only for the Google sign-in popup. This is
 * the *only* place the Firebase client SDK is used anywhere in the app —
 * every read and write of app data still goes through server code with the
 * Admin SDK. This app exists solely to get a Google ID token to hand to
 * `/api/auth/google`, which is where the actual authorization decision
 * (right domain, has an HR record) is made.
 */
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * In production, authDomain must be the app's *own* domain, so the sign-in
 * redirect stays same-origin — Chrome partitions storage between origins, and
 * a cross-origin handler silently loses the sign-in result on the way back.
 *
 * Localhost can't serve Firebase's /__/auth/handler itself, so it has to
 * borrow the project's firebaseapp.com handler. That's fine: `localhost` is an
 * authorized domain, and browsers exempt it from the storage restrictions
 * that make this arrangement fail in production.
 */
function resolveAuthDomain(): string | undefined {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return `${projectId}.firebaseapp.com`;
  }
  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: resolveAuthDomain(),
  projectId,
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// UX hint only — nudges Google's account chooser toward the right domain.
// Not a security boundary; the server re-checks the domain on the verified
// token regardless of what this sends.
googleProvider.setCustomParameters({ hd: "digitalmojo.in" });

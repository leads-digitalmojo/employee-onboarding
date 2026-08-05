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
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);

export const clientAuth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
// UX hint only — nudges Google's account chooser toward the right domain.
// Not a security boundary; the server re-checks the domain on the verified
// token regardless of what this sends.
googleProvider.setCustomParameters({ hd: "digitalmojo.in" });

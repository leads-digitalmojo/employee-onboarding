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
/**
 * authDomain stays on the project's own <project>.firebaseapp.com handler in
 * every environment. Pointing it at the app's Hosting domain looks tidier and
 * keeps sign-in same-origin, but that domain's /__/firebase/init.json still
 * advertises the firebaseapp.com authDomain, so the handler ends up configured
 * for a domain it isn't served from and the exchange fails. The popup flow
 * doesn't need same-origin anyway — it never depends on state surviving a
 * cross-site round trip, which is what broke the redirect flow.
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

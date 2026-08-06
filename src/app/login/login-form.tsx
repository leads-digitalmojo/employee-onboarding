"use client";

import { useEffect, useState } from "react";
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from "firebase/auth";
import { clientAuth, googleProvider } from "@/lib/firebase-client";

/** The official multi-colour "G" mark — required as-is by Google's brand guidelines. */
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  // True while we check whether this page load is Google redirecting the
  // user back after sign-in — avoids a flash of the button in that case.
  const [checkingRedirect, setCheckingRedirect] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function finishSignIn(idToken: string) {
    const res = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      // The Google account itself signed in fine; it's just not authorized
      // for this app. Sign it back out of the browser so a retry starts clean.
      await signOut(clientAuth);
      setError(data.error ?? "Sign-in failed. Please try again.");
      return;
    }

    window.location.href = "/onboarding";
  }

  useEffect(() => {
    // Google's own sign-in page sets a strict Cross-Origin-Opener-Policy that
    // severs the popup/opener relationship, breaking signInWithPopup's
    // popup-closed detection. A full-page redirect sidesteps that entirely.
    getRedirectResult(clientAuth)
      .then(async (result) => {
        if (!result) return;
        const idToken = await result.user.getIdToken();
        await finishSignIn(idToken);
      })
      .catch(() => {
        // Chrome can evict a background tab's IndexedDB mid-flow under memory
        // pressure (many open tabs, Incognito), surfacing as a generic
        // "Database is closing" error — a plain retry with fewer tabs open
        // usually succeeds.
        setError(
          "Could not complete Google sign-in — this can happen if the browser closed the sign-in session early. Please try again, ideally with fewer tabs open.",
        );
      })
      .finally(() => setCheckingRedirect(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      // Popup keeps the whole exchange inside one page, so it never depends on
      // storage surviving a cross-site round trip — the thing that made
      // signInWithRedirect drop the result on the way back. Viable now only
      // because authDomain is same-origin with the app.
      const result = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      await finishSignIn(idToken);
      setLoading(false);
    } catch (err) {
      const code = (err as { code?: string })?.code;

      // Closing the popup deliberately isn't worth an error banner.
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }

      // No popup available (blocker, embedded webview) — fall back to the
      // full-page redirect, handled by getRedirectResult on the way back.
      if (
        code === "auth/popup-blocked" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        try {
          await signInWithRedirect(clientAuth, googleProvider);
          return;
        } catch {
          /* fall through to the generic error below */
        }
      }

      console.error("[sign-in] popup failed:", code, err);
      setError(
        `Could not complete Google sign-in${code ? ` (${code})` : ""}. Please try again.`,
      );
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading || checkingRedirect}
        className="flex w-full items-center justify-center gap-3 rounded-[6px] border-[1.5px] border-black bg-white px-4 py-2.5 text-[14px] font-medium tracking-[0.02em] text-black transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleLogo />
        {checkingRedirect ? "Loading…" : loading ? "Signing in…" : "Sign in with Google"}
      </button>

      {error && (
        <p role="alert" className="banner-danger mt-4">
          {error}
        </p>
      )}
    </div>
  );
}

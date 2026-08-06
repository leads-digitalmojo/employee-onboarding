import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { createSession } from "@/lib/auth";

const ALLOWED_DOMAIN = "digitalmojo.in";

/**
 * Exchanges a Google ID token (obtained client-side via the Firebase Auth
 * popup) for an onboarding session — the same cookie-based session every
 * other route in the app already checks.
 *
 * Two checks, each returning a distinct error the UI can show:
 *   1. The token itself is valid and freshly issued (Admin SDK verification).
 *   2. The account's email is on the digitalmojo.in domain — this is the
 *      access control, not the `hd` hint set client-side, which a user can
 *      simply not have and still complete the popup.
 *
 * Anyone who clears both checks gets a session, creating their `users` doc
 * on the spot if this is their first sign-in. That doc starts without a
 * joining_date — People Operations sets that separately (via `npm run
 * seed`), and the app gates role selection / letter generation on it being
 * present, since it's frozen into the legal appointment letter and isn't
 * something an employee should be able to self-report.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idToken: unknown = body?.idToken;
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ error: "Missing sign-in token." }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await auth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Your sign-in could not be verified. Please try again." }, { status: 401 });
  }

  const email = decoded.email;
  if (!email || !decoded.email_verified) {
    return NextResponse.json({ error: "Your Google account has no verified email address." }, { status: 403 });
  }

  if (!email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    return NextResponse.json(
      { error: `Sign in with your ${ALLOWED_DOMAIN} account. ${email} is not on that domain.` },
      { status: 403 },
    );
  }

  const normalizedEmail = email.toLowerCase();
  const usersRef = db().collection("users");
  const snap = await usersRef.where("email", "==", normalizedEmail).limit(1).get();
  const existing = snap.docs[0];

  const userId = existing
    ? existing.id
    : (
        await usersRef.add({
          email: normalizedEmail,
          full_name: decoded.name ?? normalizedEmail,
          joining_date: null,
          is_admin: 0,
          created_at: new Date().toISOString(),
        })
      ).id;

  await createSession(userId);
  return NextResponse.json({ ok: true });
}

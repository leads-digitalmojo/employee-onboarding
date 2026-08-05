import { NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { createSession } from "@/lib/auth";

const ALLOWED_DOMAIN = "digitalmojo.in";

/**
 * Exchanges a Google ID token (obtained client-side via the Firebase Auth
 * popup) for an onboarding session — the same cookie-based session every
 * other route in the app already checks.
 *
 * Three checks, each returning a distinct error the UI can show:
 *   1. The token itself is valid and freshly issued (Admin SDK verification).
 *   2. The account's email is on the digitalmojo.in domain — this is the
 *      access control, not the `hd` hint set client-side, which a user can
 *      simply not have and still complete the popup.
 *   3. HR has actually provisioned a record for this email. Google only
 *      proves *who* someone is, not that they're an employee due to onboard —
 *      that's still owned by the `users` collection, unchanged.
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

  const snap = await db().collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
  const userDoc = snap.docs[0];
  if (!userDoc) {
    return NextResponse.json(
      { error: "No onboarding record found for this account yet. Contact People Operations." },
      { status: 404 },
    );
  }

  await createSession(userDoc.id);
  return NextResponse.json({ ok: true });
}

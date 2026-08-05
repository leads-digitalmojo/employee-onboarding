import "server-only";

import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { db } from "./firebase";
import type { User } from "./types";

const SESSION_COOKIE = "onboarding_session";
const SESSION_DAYS = 7;

/* -------------------------------- sessions -------------------------------- */
/* Identity is established by Google Sign-In and verified in
   /api/auth/google — this module only manages the app's own session cookie
   once that verification has already happened. */

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db().collection("sessions").doc(token).set({
    user_id: userId,
    created_at: new Date().toISOString(),
    expires_at: expires.toISOString(),
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db().collection("sessions").doc(token).delete();
  }
  jar.delete(SESSION_COOKIE);
}

/** Returns the logged-in user, or null. Also prunes the session if it expired. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const sessionSnap = await db().collection("sessions").doc(token).get();
  if (!sessionSnap.exists) return null;

  const session = sessionSnap.data() as { user_id: string; expires_at: string };
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await sessionSnap.ref.delete();
    return null;
  }

  const userSnap = await db().collection("users").doc(session.user_id).get();
  if (!userSnap.exists) return null;

  return { id: userSnap.id, ...userSnap.data() } as User;
}

/** For route handlers / server actions that must have a user. Throws otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** Best-effort client IP + UA, recorded alongside each signature as audit trail. */
export async function getRequestMeta(): Promise<{ ip: string; userAgent: string }> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  return {
    ip: forwarded?.split(",")[0]?.trim() || h.get("x-real-ip") || "127.0.0.1",
    userAgent: h.get("user-agent") || "unknown",
  };
}

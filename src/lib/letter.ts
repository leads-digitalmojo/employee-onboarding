import "server-only";

import { db } from "./firebase";
import type { User } from "./types";
import { appointmentLetterPages, type LetterInput } from "@/content/appointment-letter";
import type { DocPage } from "@/content/blocks";
import { findRole } from "@/content/roles";
import { COMPANY } from "@/content/company";
import { buildLetterNumber, resolveIssueDate } from "./letter-dates";

export type AppointmentLetter = {
  user_id: string;
  letter_number: string;
  role_key: string;
  full_name: string;
  designation: string;
  department: string;
  joining_date: string;
  issued_on: string;
  pages_json: string;
  generated_by: string;
  ai_model: string | null;
  generated_at: string;
};

export async function getLetter(userId: string): Promise<AppointmentLetter | null> {
  const snap = await db().collection("appointment_letters").doc(userId).get();
  return snap.exists ? (snap.data() as AppointmentLetter) : null;
}

export async function getLetterPages(userId: string): Promise<DocPage[] | null> {
  const letter = await getLetter(userId);
  return letter ? (JSON.parse(letter.pages_json) as DocPage[]) : null;
}

/**
 * Generates and freezes the employee's appointment letter. Idempotent: if a
 * letter already exists it is returned untouched, so re-running this can never
 * re-date or re-word a letter the employee may already have signed.
 *
 * The letter is the approved Digital Mojo template with three placeholders
 * filled in. Substitution is deliberately deterministic — the wording of an
 * employment contract is not something to hand to a language model.
 */
export async function generateLetter(user: User, roleKey: string): Promise<AppointmentLetter> {
  const existing = await getLetter(user.id);
  if (existing) return existing;

  if (!user.joining_date) {
    throw new Error("Cannot generate a letter before People Operations sets the joining date.");
  }

  const role = findRole(roleKey);
  if (!role) throw new Error(`Unknown role: ${roleKey}`);

  const userSnap = await db().collection("users").doc(user.id).get();
  const userRow = userSnap.data() as { letter_issue_date?: string | null; created_at?: string };

  const issuedOn = resolveIssueDate({
    joiningDate: user.joining_date,
    letterIssueDate: userRow.letter_issue_date ?? null,
    createdAt: userRow.created_at,
  });

  const input: LetterInput = {
    fullName: user.full_name,
    designation: role.designation,
    joiningDate: user.joining_date,
    issuedOn,
  };

  const pages = appointmentLetterPages(input);

  const letter: AppointmentLetter = {
    user_id: user.id,
    // Internal reference for HR records — the printed letter carries no ref line.
    letter_number: buildLetterNumber(COMPANY.shortName.replace(/\s+/g, ""), user.id, issuedOn),
    role_key: role.key,
    full_name: user.full_name,
    designation: role.designation,
    department: role.department,
    joining_date: user.joining_date,
    issued_on: issuedOn,
    pages_json: JSON.stringify(pages),
    generated_by: "template",
    ai_model: null,
    generated_at: new Date().toISOString(),
  };

  const letterRef = db().collection("appointment_letters").doc(user.id);
  const userRef = db().collection("users").doc(user.id);

  // A transaction, not a plain write: if two tabs race, the loser's write is
  // rejected and it reads back the winner's letter instead of overwriting it.
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(letterRef);
    if (snap.exists) return;
    tx.set(letterRef, letter);
    tx.set(userRef, { role_key: role.key }, { merge: true });
  });

  return (await getLetter(user.id))!;
}

/**
 * Sets the HR-owned date of joining for employees in Firestore.
 * Run with: npm run seed
 *
 * Login itself no longer requires a pre-provisioned record — anyone with a
 * valid @digitalmojo.in Google account can sign in, and a bare record is
 * created for them on first login (see src/app/api/auth/google/route.ts).
 * But role selection (and appointment letter generation) stays locked until
 * their joining_date is set here, since that date is frozen into the letter
 * and isn't something an employee should self-report.
 *
 * Uses the same credential resolution as the app (FIREBASE_SERVICE_ACCOUNT_KEY
 * env var, or Application Default Credentials) — see .env.example. Talks to
 * firebase-admin directly rather than importing src/lib/firebase.ts, because
 * that module is marked "server-only" and this script runs outside Next.
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { loadEnvLocal } from "./env.ts";

loadEnvLocal();

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const app =
  getApps()[0] ??
  (key ? initializeApp({ credential: cert(JSON.parse(key)) }) : initializeApp());
const db = getFirestore(app);

const employees = [
  {
    email: "abiram@digitalmojo.in",
    full_name: "Abiram",
    joining_date: "2026-08-17",
    // Set by HR when the record is provisioned — this is the date printed on the
    // letter, and it never shifts to whenever the employee first logs in.
    letter_issue_date: "2026-07-28",
  },
  {
    email: "leads@digitalmojo.in",
    full_name: "Leads",
    joining_date: "2026-08-24",
    letter_issue_date: "2026-08-03",
  },
];

async function seed() {
  const users = db.collection("users");

  for (const e of employees) {
    const existing = await users.where("email", "==", e.email).limit(1).get();
    const doc = existing.docs[0];

    const fields = {
      email: e.email,
      full_name: e.full_name,
      joining_date: e.joining_date,
      letter_issue_date: e.letter_issue_date,
      is_admin: 0,
    };

    if (doc) {
      // Preserve created_at and role_key/letter linkage — only refresh the
      // HR-provisioned fields.
      await doc.ref.set(fields, { merge: true });
    } else {
      await users.add({ ...fields, created_at: new Date().toISOString() });
    }
    console.log(`  ✓ ${e.full_name.padEnd(16)} ${e.email}`);
  }

  console.log(`\nProvisioned ${employees.length} employees. Sign in with their @digitalmojo.in Google account.\n`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

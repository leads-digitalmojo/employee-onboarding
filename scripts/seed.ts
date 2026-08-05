/**
 * Seeds Firestore with HR-provisioned employee records.
 * Run with: npm run seed
 *
 * These are the accounts allowed to sign in — login is Google Sign-In
 * restricted to @digitalmojo.in, so every email here must be a real
 * account under that Google Workspace. There is no password to seed
 * anymore; identity comes from Google, this just provisions the HR record
 * an authenticated email is matched against.
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
    employee_code: "DM-2026-0001",
    designation: "Performance Marketing Specialist",
    department: "Performance Marketing",
    work_location: "Hyderabad (Banjara Hills)",
    annual_ctc: 2400000,
    joining_date: "2026-08-17",
    reporting_to: "People Operations",
    // Set by HR when the record is provisioned — this is the date printed on the
    // letter, and it never shifts to whenever the employee first logs in.
    letter_issue_date: "2026-07-28",
  },
  {
    email: "leads@digitalmojo.in",
    full_name: "Leads",
    employee_code: "DM-2026-0002",
    designation: "Graphic Designer",
    department: "Creative",
    work_location: "Hyderabad (Banjara Hills)",
    annual_ctc: 1650000,
    joining_date: "2026-08-24",
    reporting_to: "People Operations",
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
      employee_code: e.employee_code,
      designation: e.designation,
      department: e.department,
      work_location: e.work_location,
      annual_ctc: e.annual_ctc,
      joining_date: e.joining_date,
      reporting_to: e.reporting_to,
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

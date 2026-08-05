# Employee Onboarding Portal

An employee logs in, confirms their role, and works through four steps: sign the
generated appointment letter page
by page, sign the leave policy, sign the attendance policy, then submit their
statutory identifiers and upload supporting documents.

## Running it locally

Two ways to run this, depending on whether you have a real Firebase project yet.

### Option A — against the local emulators (no Firebase project needed)

```bash
npm install
firebase login                         # once
firebase emulators:start --project demo-onboarding --only firestore,storage
```

In a second terminal:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
GCLOUD_PROJECT=demo-onboarding \
FIREBASE_STORAGE_BUCKET=demo-onboarding.firebasestorage.app \
npm run seed

FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199 \
GCLOUD_PROJECT=demo-onboarding \
FIREBASE_STORAGE_BUCKET=demo-onboarding.firebasestorage.app \
npm run dev      # http://localhost:3000
```

The emulator's Firestore/Storage UI is at `http://localhost:4000` — useful for
inspecting what the app actually wrote. Data lives only in the emulator's memory
and is gone when it stops; re-run `npm run seed` each session.

### Option B — against a real Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com),
   enable **Firestore** (production mode) and **Storage** (requires the project
   to be on the **Blaze** plan — see "Auth & billing" below).
2. **Authentication → Sign-in method → Google → Enable.** This is required —
   login won't work without it.
3. Register a Web app (Project Settings → General → Your apps) to get the
   `apiKey` / `authDomain` / `projectId` for `.env.local`.
4. Project Settings → Service Accounts → Generate new private key.
5. Copy `.env.example` to `.env.local` and fill in all five values.
6. Edit `scripts/seed.ts` — replace the placeholder emails with real
   `@digitalmojo.in` addresses you can actually sign in with, and their real
   HR details (designation, CTC, joining date, reporting line).
7. `npm install && npm run seed && npm run dev`

Login is **Google Sign-In, restricted to @digitalmojo.in accounts** — there's no
password. To sign in as a given employee you need real access to their
@digitalmojo.in Google account; `npm run seed` only provisions the HR record
their email is checked against, not a credential. See "Auth" below for the
one-time Firebase Auth setup this needs.

## Deploying to Firebase

This app is built to run on the **free (Spark) plan** comfortably — it's a handful
of employees signing in occasionally, nowhere near Spark's Firestore/Storage
quotas.

```bash
npm install -g firebase-tools   # if you don't have it
firebase login
firebase init hosting:apphosting   # links this repo to your Firebase project
```

Edit `.firebaserc` to point `default` at your real project ID, and
`apphosting.yaml`'s `FIREBASE_STORAGE_BUCKET` value to match. Then:

```bash
firebase deploy --only firestore:rules,storage:rules,apphosting
```

App Hosting builds and serves the Next.js app directly (SSR, API routes, server
actions — nothing here needs adapting) on a Cloud Run-backed service that scales
to zero between requests. Its own service account already has Firestore and
Storage access, so `FIREBASE_SERVICE_ACCOUNT_KEY` is not needed there — only set
it if you ever deploy this app somewhere that isn't Firebase/GCP infrastructure.

**Seed production once, from your machine, against the real project:**

```bash
FIREBASE_SERVICE_ACCOUNT_KEY="$(cat path/to/serviceAccountKey.json)" \
FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app \
npm run seed
```

## How it works

**Stack** — Next.js 15 (App Router) + TypeScript + Tailwind v4, on **Firestore**
(data) and **Firebase Storage** (uploaded files), via the Admin SDK
([`src/lib/firebase.ts`](src/lib/firebase.ts)). All reads and writes happen in
server code — no Firebase client SDK ships to the browser, and
[`firestore.rules`](firestore.rules) / [`storage.rules`](storage.rules) deny all
direct client access accordingly.

**Auth — Google Sign-In, restricted to @digitalmojo.in.** The only place the
Firebase *client* SDK is used anywhere in this app is
[`src/lib/firebase-client.ts`](src/lib/firebase-client.ts), and its only job is
the Google sign-in popup. Everything else — every read, every write — still goes
through server code with the Admin SDK, same as before.

The flow, and where each check lives:

1. **Browser** — [`src/app/login/login-form.tsx`](src/app/login/login-form.tsx)
   opens the Google popup (`signInWithPopup`) and gets a Google ID token back.
   That's it; the popup itself doesn't decide anything.
2. **`POST /api/auth/google`** ([route](src/app/api/auth/google/route.ts)) —
   the token is verified server-side with the Admin SDK
   (`auth().verifyIdToken`), which is the only step that actually proves the
   token is real and unexpired. Then, in order:
   - the email must be `@digitalmojo.in` — this is the real access control,
     not the `hd` hint the popup sends (that's just a UX nudge on Google's
     account picker; anyone can omit it and still complete the popup)
   - a `users` document with that email must already exist — Google proves
     *who* someone is, not that HR has provisioned them yet. No match →
     "Contact People Operations", same as before.
   - on success, the existing session-cookie mechanism
     ([`src/lib/auth.ts`](src/lib/auth.ts)) takes over unchanged: a random
     token, a `sessions/{token}` Firestore document, an HTTP-only cookie, 7-day
     expiry.
3. Every other route still just checks that cookie — nothing downstream of
   login changed.

**One-time setup this needs**, done once per Firebase project (not per
deploy) — see [Firebase Console → Authentication → Sign-in method](https://console.firebase.google.com)
→ enable **Google** as a provider. `npm run seed` provisions *HR records*
(name, CTC, joining date, …) keyed by email — it has never controlled who can
log in even in the old password version, and it especially doesn't now: only a
real @digitalmojo.in Google account can complete the popup at all.

`NEXT_PUBLIC_FIREBASE_API_KEY` / `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` /
`NEXT_PUBLIC_FIREBASE_PROJECT_ID` in `.env.local` are not secrets — they identify
the Firebase project to the browser the same way a public API endpoint does.
Nothing sensitive is reachable with them alone; the domain check and the HR-record
match are what actually gate access, and both run server-side.

**Collections** (all under the Firestore root):

| Collection | Doc ID | Holds |
| --- | --- | --- |
| `users` | auto | Employee record — HR-provisioned fields |
| `sessions` | session token | `{ user_id, expires_at }` |
| `appointment_letters` | user ID | The frozen letter snapshot (see below) |
| `signatures` | `{userId}_{docType}_{pageNo}` | One typed signature |
| `acceptances` | `{userId}_{docType}` | One "read & accepted" record |
| `kyc` | user ID | Statutory identifiers, bank, emergency contact |
| `documents` | auto | Metadata for one uploaded file; bytes live in Storage |

Composite-key document IDs (`signatures`, `acceptances`) make "does this exist"
and "overwrite this" single-document operations rather than queries — no
composite indexes needed, which is why [`firestore.indexes.json`](firestore.indexes.json)
is empty.

**The appointment letter is generated once and frozen.** At first login the employee
picks their role; the letter is then rendered and the whole thing — every page, both
dates, the CTC breakup — is stored as a single Firestore document
(`appointment_letters/{userId}`, with the pages as a JSON string field). Afterwards
the letter is read back from that snapshot, never re-rendered. Generation runs
inside a Firestore transaction, so two concurrent first-logins (two tabs) can't
produce two different letters — the loser's transaction reads back the winner's
already-created document instead of overwriting it. See
[`src/lib/letter.ts`](src/lib/letter.ts).

The date rules live in [`src/lib/letter-dates.ts`](src/lib/letter-dates.ts) and read no
clock at all. Three dates are kept distinct:

| Date | Source | Changes? |
| --- | --- | --- |
| Date of joining | `users.joining_date`, set by HR | Never |
| Letter date | `users.letter_issue_date`, else the record's creation date clamped to the joining date | Frozen at generation |
| Signed-at / generated-at | Server clock | Audit trail only — never printed as the joining date |

So an employee who joined on the 1st and logs in on the 4th gets a letter dated before
their joining date, not on the day they happened to log in — and the same letter every
time they open it.

**The letter is the approved Digital Mojo template, verbatim.**
[`src/content/appointment-letter.ts`](src/content/appointment-letter.ts) reproduces all
14 clauses, their numbering and the source document's 5 page breaks. Exactly three
placeholders are filled: `"Candidate Name"`, `"Role Name"` and the `"D/M/Y"` joining
date. Substitution is deterministic — no model writes any part of a contract. Do not
reword, reorder or add clauses in that file; change the approved template first and
mirror it.

**Signing vs. accepting** — each document is a list of pages
([`src/content/`](src/content/)), but they are completed two different ways. Which
is which is declared once in `REQUIRES_SIGNATURE` in [`src/lib/types.ts`](src/lib/types.ts),
and the UI, the progress logic and both API routes all read from it.

- **Appointment letter** — generated once at first login, then signed page by page.
  The employee **types their full name** as the signature; it is stored as text with
  the timestamp, IP and user agent. The typed name must match the name on their
  record (case- and spacing-insensitive), checked on the server as well as the
  client — a typed signature only means something if it is the signer's own name.
  You cannot advance until the current page is signed, and the final submit is
  re-checked in [`src/app/api/acceptance/route.ts`](src/app/api/acceptance/route.ts)
  — the client gate is convenience, not the control. Re-signing a page clears the
  document's acceptance, so a submitted document always matches its signatures.
- **Leave and attendance policies** — read and accepted by declaration, no signature.
  The employee must open every page before the declaration checkbox will submit.
  Posting a signature for these documents is rejected by the API.

**Documents step** — PAN, Aadhaar, UAN, PF, ESIC, bank details and an emergency
contact, validated by the same rules on both sides
([`src/lib/validation.ts`](src/lib/validation.ts)). Aadhaar is checked against its
Verhoeff check digit, so a transposed digit is caught at entry. Uploads are limited
to PDF/JPG/PNG/WebP under 5 MB and are sniffed for magic bytes, so a renamed file
is rejected. Files are written to Firebase Storage under a random name namespaced
by the uploader's user ID (`{userId}/{kind}-{uuid}.ext`) — the original filename
never touches the storage path. Served back through
[`src/app/api/documents/[id]/route.ts`](src/app/api/documents/%5Bid%5D/route.ts),
which checks the Firestore metadata's `user_id` before ever touching Storage, so a
document ID from another account 404s rather than leaking a download URL.

**Download** — `GET /api/letter/pdf` renders the frozen letter to an A4 PDF:
one sheet per letter page, the logo on the first and last sheets, and each page's
captured signature reproduced with a "signed electronically … on … from …" line.
Scoped to the session user, so an employee can only download their own letter.
Buttons sit on the letter view and the summary page.

The PDF embeds Noto Sans from [`assets/fonts/`](assets/fonts/) rather than a
built-in PDF font — the standard fonts are WinAnsi-encoded and cannot render the
rupee sign in clause 9. The logo comes from `public/logo.png`. Both are read from
the deployed build's own filesystem at request time (a normal read of a bundled
asset, not user-written state) — no Storage round-trip, and nothing here needs to
change for App Hosting's stateless containers.

**Logo** — the artwork itself lives at `public/logo.png` (transparent PNG). The web
view serves it from `/logo.png`; the PDF reads the same file from disk and embeds it.
[`src/content/logo.ts`](src/content/logo.ts) holds the path and aspect ratio so both
consumers stay in step. To change the logo, replace the file and update `LOGO_ASPECT`
to its width ÷ height.

**Summary** — `/onboarding/summary` shows the full audit trail: every signature with
its timestamp and IP, masked identifiers, and links to each uploaded file.

## Design system

The UI follows the **DigitalMojo HR Platform** design system. The tokens and
component classes live in one place, [`src/app/globals.css`](src/app/globals.css):
`.card`, `.btn-primary` / `.btn-secondary` / `.btn-danger`, `.field`, `.label`,
`.badge`, `.banner-*`, `.data-table`, `.page-title` / `.page-sub` / `.section-title`.
Build pages out of those rather than one-off Tailwind classes, so a change to the
system lands everywhere at once.

The rules that are easy to break by accident:

- **Never add a `box-shadow`.** Depth comes from solid 1.5px black borders. The
  only shadow in the codebase is the yellow input focus glow.
- Yellow `#ffc61a` is the single accent — hover states flip to yellow rather than
  tinting or lifting.
- Everything carries at least `0.02em` letter-spacing; buttons, labels, badges,
  table headers and nav are uppercase.
- Font weight never exceeds 700, and 700 is reserved for large numbers.
- League Spartan is the only family, loaded via `next/font` in
  [`src/app/layout.tsx`](src/app/layout.tsx).

## Layout

```
src/
  app/
    login/                    sign in (server action)
    onboarding/               layout with progress bar + the four steps
      role/                   first-login role selection -> letter generation
      appointment-letter/     5 frozen pages, read from the stored snapshot
      leave-policy/           3 pages
      attendance-policy/      3 pages
      documents/              identifiers + uploads
      summary/                audit trail
    api/                      signatures, acceptance, kyc, documents
  components/                 signature-input, document-signer, kyc-form, uploader, logo
  content/                    document text as data, not JSX
  lib/                        firebase.ts, auth, validation, progress, letter generation, PDF rendering
assets/fonts/                 Noto Sans, embedded into generated PDFs
scripts/
  seed.ts                     demo employees, written straight to Firestore
  env.ts                      tiny .env.local loader for scripts run outside Next
firebase.json                 emulator ports, rules file locations
firestore.rules               deny-all (server-only access via Admin SDK)
storage.rules                 deny-all (server-only access via Admin SDK)
apphosting.yaml                Firebase App Hosting deploy config
```

## Changing the documents

Policy text is plain data in [`src/content/`](src/content/) using a small block
format (`h`, `p`, `ul`, `ol`, `note`, `table`). Adding a page to an array adds a page
that must be signed — page counts, the progress bar and the server-side acceptance
check all read from the same source. Company details live in
[`src/content/company.ts`](src/content/company.ts). The appointment letter is the
exception — it mirrors an approved document and must not be edited freehand.

## Before using this for real

- There is no HR-side view yet: no way to review, approve or reject a submission.
  The `is_admin` field exists on the user record but nothing reads it.
- Signatures are typed names with an IP/timestamp trail, not cryptographically
  signed PDFs. For an evidentiary standard, wire this to an eSign provider
  (Aadhaar eSign / DocuSign) instead.
- No rate limiting on the login route, no email delivery. (Password reset no
  longer applies — there's no password; Google owns that account recovery.)
- `email` uniqueness on `users` is enforced by convention (the seed script
  upserts by email), not by the database — there's no self-registration flow, so
  this hasn't mattered, but keep it in mind if one gets added later.
- The domain check in `/api/auth/google` is a plain `endsWith("@digitalmojo.in")`
  string match. That's fine as long as every real `@digitalmojo.in` address is a
  Google Workspace account under your control — it would not be fine if that
  domain ever had non-Workspace or externally-created Google accounts on it.
- Firestore's free quota (50K reads / 20K writes / 20K deletes per day) is far
  more than this app's traffic needs, but if you ever point it at a much larger
  workforce, revisit `getDocuments`/`signedPageNumbers` — they currently fetch a
  user's full result set per call rather than paginating.

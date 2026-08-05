import "server-only";

import { db } from "./firebase";
import { REQUIRED_DOC_KINDS, REQUIRES_SIGNATURE } from "./types";
import type { DocType, KycDetails, StepStatus, UploadedDocument, User } from "./types";
import { LEAVE_POLICY_PAGES } from "@/content/leave-policy";
import { ATTENDANCE_POLICY_PAGES } from "@/content/attendance-policy";
import type { DocPage } from "@/content/blocks";
import { getLetterPages } from "./letter";

export async function pagesFor(docType: DocType, user: User): Promise<DocPage[]> {
  switch (docType) {
    case "appointment_letter":
      // Read back the frozen snapshot — the letter is never re-rendered from
      // the template, so its text and dates cannot drift after signing.
      return (await getLetterPages(user.id)) ?? [];
    case "leave_policy":
      return LEAVE_POLICY_PAGES;
    case "attendance_policy":
      return ATTENDANCE_POLICY_PAGES;
  }
}

/** Composite key so a page's signature is addressable without a query. */
function signatureId(userId: string, docType: DocType, pageNo: number): string {
  return `${userId}_${docType}_${pageNo}`;
}

function acceptanceId(userId: string, docType: DocType): string {
  return `${userId}_${docType}`;
}

export async function signedPageNumbers(userId: string, docType: DocType): Promise<number[]> {
  const snap = await db()
    .collection("signatures")
    .where("user_id", "==", userId)
    .where("doc_type", "==", docType)
    .get();
  return snap.docs.map((d) => (d.data() as { page_no: number }).page_no).sort((a, b) => a - b);
}

/** The typed name recorded as the signature for one page, if any. */
export async function getSignature(userId: string, docType: DocType, pageNo: number): Promise<string | null> {
  const snap = await db().collection("signatures").doc(signatureId(userId, docType, pageNo)).get();
  if (!snap.exists) return null;
  return (snap.data() as { signature_text: string }).signature_text;
}

/** Every recorded signature for a document, keyed by page number — one query
 *  instead of one read per page. */
export async function getSignaturesForDoc(userId: string, docType: DocType): Promise<Record<number, string>> {
  const snap = await db()
    .collection("signatures")
    .where("user_id", "==", userId)
    .where("doc_type", "==", docType)
    .get();
  const result: Record<number, string> = {};
  for (const d of snap.docs) {
    const data = d.data() as { page_no: number; signature_text: string };
    result[data.page_no] = data.signature_text;
  }
  return result;
}

export async function isAccepted(userId: string, docType: DocType): Promise<boolean> {
  const snap = await db().collection("acceptances").doc(acceptanceId(userId, docType)).get();
  return snap.exists;
}

export type SignatureRow = {
  page_no: number;
  signature_text: string;
  signed_at: string;
  ip_address: string | null;
};

/** Full signature rows for a document (audit view — summary page). */
export async function getSignatureRows(userId: string, docType: DocType): Promise<SignatureRow[]> {
  const snap = await db()
    .collection("signatures")
    .where("user_id", "==", userId)
    .where("doc_type", "==", docType)
    .get();
  return snap.docs
    .map((d) => d.data() as SignatureRow)
    .sort((a, b) => a.page_no - b.page_no);
}

export type AcceptanceDetail = { accepted_at: string; ip_address: string | null };

/** Acceptance record for a policy document (audit view — summary page). */
export async function getAcceptance(userId: string, docType: DocType): Promise<AcceptanceDetail | null> {
  const snap = await db().collection("acceptances").doc(acceptanceId(userId, docType)).get();
  return snap.exists ? (snap.data() as AcceptanceDetail) : null;
}

export async function getKyc(userId: string): Promise<KycDetails | null> {
  const snap = await db().collection("kyc").doc(userId).get();
  if (!snap.exists) return null;
  return snap.data() as KycDetails;
}

export async function getDocuments(userId: string): Promise<UploadedDocument[]> {
  const snap = await db().collection("documents").where("user_id", "==", userId).get();
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as UploadedDocument & { uploaded_at: string });
  return docs.sort((a, b) => (a.uploaded_at < b.uploaded_at ? 1 : -1));
}

/** True when KYC fields are saved and every mandatory document has at least one upload. */
export async function documentsStepComplete(userId: string): Promise<{ complete: boolean; detail: string }> {
  const [kyc, documents] = await Promise.all([getKyc(userId), getDocuments(userId)]);
  const uploaded = new Set(documents.map((d) => d.doc_kind));
  const missing = REQUIRED_DOC_KINDS.filter((d) => !uploaded.has(d.kind));

  if (!kyc?.submitted_at) {
    return { complete: false, detail: "Identification details not submitted" };
  }
  if (missing.length > 0) {
    return { complete: false, detail: `${missing.length} document${missing.length > 1 ? "s" : ""} pending upload` };
  }
  return { complete: true, detail: "Details saved and all documents uploaded" };
}

async function docStep(
  user: User,
  docType: DocType,
  title: string,
  description: string,
  href: string,
): Promise<StepStatus> {
  const pages = await pagesFor(docType, user);
  const total = pages.length;
  const accepted = await isAccepted(user.id, docType);

  // Policies are read and accepted; only the appointment letter is signed per page.
  if (!REQUIRES_SIGNATURE[docType]) {
    return {
      id: docType,
      title,
      description,
      href,
      complete: accepted,
      detail: accepted ? `Read and accepted — ${total} pages` : `${total} pages to read and accept`,
    };
  }

  if (total === 0) {
    return { id: docType, title, description, href, complete: false, detail: "Letter not generated yet" };
  }

  const signed = (await signedPageNumbers(user.id, docType)).length;
  return {
    id: docType,
    title,
    description,
    href,
    complete: accepted && signed === total,
    detail: accepted && signed === total ? `Signed — all ${total} pages` : `${signed} of ${total} pages signed`,
  };
}

export async function getSteps(user: User): Promise<StepStatus[]> {
  const [appointmentLetter, leavePolicy, attendancePolicy, docs] = await Promise.all([
    docStep(
      user,
      "appointment_letter",
      "Appointment Letter",
      "Read and sign each page of your letter of appointment.",
      "/onboarding/appointment-letter",
    ),
    docStep(
      user,
      "leave_policy",
      "Leave, Work & Rewards Policy",
      "Work structure, your 27 days of leave, WFH rules and the rewards program.",
      "/onboarding/leave-policy",
    ),
    docStep(
      user,
      "attendance_policy",
      "Attendance Policy",
      "Working hours, late marks, remote work and compliance.",
      "/onboarding/attendance-policy",
    ),
    documentsStepComplete(user.id),
  ]);

  return [
    appointmentLetter,
    leavePolicy,
    attendancePolicy,
    {
      id: "documents",
      title: "Identification & Documents",
      description: "Submit your PAN, Aadhaar, UAN, bank details and upload supporting documents.",
      href: "/onboarding/documents",
      complete: docs.complete,
      detail: docs.detail,
    },
  ];
}

export type DocType = "appointment_letter" | "leave_policy" | "attendance_policy";

export type User = {
  /** Firestore document ID. */
  id: string;
  email: string;
  full_name: string;
  /** Set by HR once the employee's start date is confirmed. Role selection
   *  (and thus letter generation) stays locked until this is set. */
  joining_date: string | null;
  is_admin: number;
  created_at?: string;
  letter_issue_date?: string | null;
  role_key?: string | null;
};

export type KycDetails = {
  user_id: string;
  pan_number: string | null;
  aadhaar_number: string | null;
  uan_number: string | null;
  pf_number: string | null;
  esic_number: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  submitted_at: string | null;
};

export type UploadedDocument = {
  id: string;
  doc_kind: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
};

export type StepId = DocType | "documents";

export type StepStatus = {
  id: StepId;
  title: string;
  description: string;
  href: string;
  complete: boolean;
  detail: string;
};

/** Document kinds the employee must upload, in display order. */
export const REQUIRED_DOC_KINDS = [
  { kind: "pan_card", label: "PAN Card", hint: "Front side, clearly readable" },
  { kind: "aadhaar_card", label: "Aadhaar Card", hint: "Front and back, single PDF preferred" },
  { kind: "cancelled_cheque", label: "Cancelled Cheque / Bank Passbook", hint: "Must show account number and IFSC" },
  { kind: "photograph", label: "Passport Size Photograph", hint: "Recent, white background" },
] as const;

/** Optional but commonly requested. */
export const OPTIONAL_DOC_KINDS = [
  { kind: "relieving_letter", label: "Relieving Letter (previous employer)", hint: "Skip if this is your first job" },
  { kind: "salary_slip", label: "Last 3 Salary Slips", hint: "Skip if this is your first job" },
] as const;

export const ALL_DOC_KINDS = [...REQUIRED_DOC_KINDS, ...OPTIONAL_DOC_KINDS];

/**
 * Only the appointment letter is signed page by page. The policies are read
 * and accepted with a declaration — no signature is captured for them.
 */
export const REQUIRES_SIGNATURE: Record<DocType, boolean> = {
  appointment_letter: true,
  leave_policy: false,
  attendance_policy: false,
};

export const DOC_LABELS: Record<DocType, string> = {
  appointment_letter: "Appointment Letter",
  leave_policy: "Leave, Work & Rewards Policy",
  attendance_policy: "Attendance Policy",
};

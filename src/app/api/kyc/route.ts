import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { validateKyc, type KycInput } from "@/lib/validation";

const FIELDS: (keyof KycInput)[] = [
  "pan_number",
  "aadhaar_number",
  "uan_number",
  "pf_number",
  "esic_number",
  "bank_name",
  "account_number",
  "ifsc_code",
  "emergency_name",
  "emergency_phone",
  "emergency_relation",
];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = Object.fromEntries(
    FIELDS.map((f) => [f, String(body[f] ?? "").trim()]),
  ) as KycInput;

  // Normalise the formats that are conventionally uppercase before validating.
  input.pan_number = input.pan_number.toUpperCase();
  input.ifsc_code = input.ifsc_code.toUpperCase();
  input.aadhaar_number = input.aadhaar_number.replace(/\s/g, "");

  const errors = validateKyc(input);
  if (Object.keys(errors).length > 0) {
    return NextResponse.json({ error: "Please correct the highlighted fields.", errors }, { status: 400 });
  }

  const ref = db().collection("kyc").doc(user.id);
  const now = new Date().toISOString();

  // submitted_at is set once, on first save, and never overwritten afterwards.
  const existing = await ref.get();
  const submittedAt = (existing.data()?.submitted_at as string | undefined) ?? now;

  await ref.set({
    user_id: user.id,
    pan_number: input.pan_number,
    aadhaar_number: input.aadhaar_number,
    uan_number: input.uan_number || null,
    pf_number: input.pf_number || null,
    esic_number: input.esic_number || null,
    bank_name: input.bank_name,
    account_number: input.account_number,
    ifsc_code: input.ifsc_code,
    emergency_name: input.emergency_name,
    emergency_phone: input.emergency_phone,
    emergency_relation: input.emergency_relation,
    submitted_at: submittedAt,
    updated_at: now,
  });

  return NextResponse.json({ ok: true });
}

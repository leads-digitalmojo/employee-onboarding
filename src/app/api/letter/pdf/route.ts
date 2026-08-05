import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { getLetter, getLetterPages } from "@/lib/letter";
import { buildLetterPdf, type LetterSignature } from "@/lib/pdf";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const [letter, pages] = await Promise.all([getLetter(user.id), getLetterPages(user.id)]);
  if (!letter || !pages) {
    return NextResponse.json({ error: "Your appointment letter has not been generated yet." }, { status: 404 });
  }

  // Scoped to the session user — an employee can only download their own letter.
  const snap = await db()
    .collection("signatures")
    .where("user_id", "==", user.id)
    .where("doc_type", "==", "appointment_letter")
    .get();
  const signatures = snap.docs
    .map((d) => d.data() as LetterSignature)
    .sort((a, b) => a.page_no - b.page_no);

  const pdf = await buildLetterPdf({
    pages,
    employeeName: letter.full_name,
    employeeCode: letter.employee_code,
    letterNumber: letter.letter_number,
    signatures,
  });

  const filename = `Appointment-Letter-${letter.employee_code}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

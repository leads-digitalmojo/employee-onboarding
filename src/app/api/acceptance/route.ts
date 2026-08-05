import { NextResponse } from "next/server";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { pagesFor, signedPageNumbers } from "@/lib/onboarding";
import { DOC_LABELS, REQUIRES_SIGNATURE, type DocType } from "@/lib/types";

function isDocType(value: unknown): value is DocType {
  return typeof value === "string" && value in DOC_LABELS;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !isDocType(body.docType)) {
    return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  }
  const docType: DocType = body.docType;

  // Only signed documents gate on signatures; policies are accepted by declaration.
  // The client gates this too, but the server is the one that decides.
  if (REQUIRES_SIGNATURE[docType]) {
    const total = (await pagesFor(docType, user)).length;
    if (total === 0) {
      return NextResponse.json({ error: "This document has not been generated yet." }, { status: 409 });
    }
    const signed = (await signedPageNumbers(user.id, docType)).length;
    if (signed < total) {
      return NextResponse.json(
        { error: `All ${total} pages must be signed. You have signed ${signed}.` },
        { status: 400 },
      );
    }
  }

  const { ip } = await getRequestMeta();
  await db()
    .collection("acceptances")
    .doc(`${user.id}_${docType}`)
    .set({
      user_id: user.id,
      doc_type: docType,
      ip_address: ip,
      accepted_at: new Date().toISOString(),
    });

  return NextResponse.json({ ok: true });
}

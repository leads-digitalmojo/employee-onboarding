import { NextResponse } from "next/server";
import { getCurrentUser, getRequestMeta } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { pagesFor } from "@/lib/onboarding";
import type { DocType } from "@/lib/types";
import { DOC_LABELS, REQUIRES_SIGNATURE } from "@/lib/types";

const MAX_SIGNATURE_LENGTH = 120;

/** Ignores case and extra spacing, so "priya  sharma" matches "Priya Sharma". */
function normalise(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function isDocType(value: unknown): value is DocType {
  return typeof value === "string" && value in DOC_LABELS;
}

function signatureId(userId: string, docType: DocType, pageNo: number): string {
  return `${userId}_${docType}_${pageNo}`;
}

function acceptanceId(userId: string, docType: DocType): string {
  return `${userId}_${docType}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !isDocType(body.docType)) {
    return NextResponse.json({ error: "Unknown document." }, { status: 400 });
  }
  const docType: DocType = body.docType;

  if (!REQUIRES_SIGNATURE[docType]) {
    return NextResponse.json(
      { error: "This document is accepted by declaration and is not signed." },
      { status: 400 },
    );
  }

  const pageNo = Number(body.pageNo);
  const totalPages = (await pagesFor(docType, user)).length;
  if (!Number.isInteger(pageNo) || pageNo < 1 || pageNo > totalPages) {
    return NextResponse.json({ error: "Invalid page number." }, { status: 400 });
  }

  const raw: unknown = body.signatureText;
  if (typeof raw !== "string" || raw.trim() === "") {
    return NextResponse.json({ error: "Type your full name to sign this page." }, { status: 400 });
  }
  const signatureText = raw.trim().replace(/\s+/g, " ");
  if (signatureText.length > MAX_SIGNATURE_LENGTH) {
    return NextResponse.json({ error: "That name is too long." }, { status: 400 });
  }
  // The client checks this too, but the server is what decides: a typed
  // signature only means anything if it is the signer's own name.
  if (normalise(signatureText) !== normalise(user.full_name)) {
    return NextResponse.json(
      { error: `Your signature must match the name on your record: ${user.full_name}` },
      { status: 400 },
    );
  }

  const { ip, userAgent } = await getRequestMeta();

  // Re-signing a page overwrites the previous entry and re-stamps the audit fields.
  await db()
    .collection("signatures")
    .doc(signatureId(user.id, docType, pageNo))
    .set({
      user_id: user.id,
      doc_type: docType,
      page_no: pageNo,
      signature_text: signatureText,
      ip_address: ip,
      user_agent: userAgent,
      signed_at: new Date().toISOString(),
    });

  // Changing a signature invalidates a previously completed submission.
  await db().collection("acceptances").doc(acceptanceId(user.id, docType)).delete();

  return NextResponse.json({ ok: true, pageNo });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const docType = url.searchParams.get("docType");
  const pageNo = Number(url.searchParams.get("pageNo"));

  if (!isDocType(docType) || !Number.isInteger(pageNo)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  await db().collection("signatures").doc(signatureId(user.id, docType, pageNo)).delete();
  await db().collection("acceptances").doc(acceptanceId(user.id, docType)).delete();

  return NextResponse.json({ ok: true });
}

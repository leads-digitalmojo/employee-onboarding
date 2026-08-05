import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { bucket, db } from "@/lib/firebase";
import { ALL_DOC_KINDS } from "@/lib/types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map([
  ["application/pdf", ".pdf"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

/** Cheap magic-byte check so a renamed .exe can't pose as a PDF. */
function sniffMatches(mime: string, head: Uint8Array): boolean {
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  switch (mime) {
    case "application/pdf":
      return startsWith(0x25, 0x50, 0x44, 0x46); // %PDF
    case "image/jpeg":
      return startsWith(0xff, 0xd8, 0xff);
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47);
    case "image/webp":
      return startsWith(0x52, 0x49, 0x46, 0x46); // RIFF
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid upload." }, { status: 400 });

  const kind = String(form.get("docKind") ?? "");
  if (!ALL_DOC_KINDS.some((d) => d.kind === kind)) {
    return NextResponse.json({ error: "Unknown document type." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Files must be 5 MB or smaller." }, { status: 413 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "Only PDF, JPG, PNG and WebP files are accepted." },
      { status: 415 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!sniffMatches(file.type, bytes.subarray(0, 8))) {
    return NextResponse.json(
      { error: "That file's contents don't match its type. Please re-export and try again." },
      { status: 415 },
    );
  }

  // Stored name is random: the original name never touches the storage path.
  // Namespaced under the user's own id, matching Storage security rules that
  // scope each employee to their own prefix.
  const storedName = `${user.id}/${kind}-${crypto.randomUUID()}${extension}`;
  await bucket().file(storedName).save(bytes, {
    contentType: file.type,
    resumable: false,
  });

  const uploadedAt = new Date().toISOString();
  const docRef = await db().collection("documents").add({
    user_id: user.id,
    doc_kind: kind,
    original_name: file.name.slice(0, 200),
    stored_name: storedName,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_at: uploadedAt,
  });

  return NextResponse.json({
    ok: true,
    document: {
      id: docRef.id,
      doc_kind: kind,
      original_name: file.name,
      stored_name: storedName,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_at: uploadedAt,
    },
  });
}

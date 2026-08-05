import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bucket, db } from "@/lib/firebase";

type Row = { stored_name: string; mime_type: string; original_name: string; user_id: string };

/** Looks the row up scoped to the session user, so ids from another account 404. */
async function ownedDocument(userId: string, id: string): Promise<Row | null> {
  const snap = await db().collection("documents").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Row;
  if (data.user_id !== userId) return null;
  return data;
}

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const row = await ownedDocument(user.id, id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [file] = await bucket().file(row.stored_name).download().catch(() => [null]);
  if (!file) return NextResponse.json({ error: "File missing in storage." }, { status: 404 });

  return new NextResponse(new Uint8Array(file), {
    headers: {
      "Content-Type": row.mime_type,
      "Content-Disposition": `inline; filename="${row.original_name.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await ctx.params;
  const row = await ownedDocument(user.id, id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await db().collection("documents").doc(id).delete();
  await bucket().file(row.stored_name).delete().catch(() => {});

  return NextResponse.json({ ok: true });
}

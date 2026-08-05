"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadedDocument } from "@/lib/types";

type Kind = { kind: string; label: string; hint: string };

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadRow({
  kind,
  required,
  documents,
  onChanged,
}: {
  kind: Kind;
  required: boolean;
  documents: UploadedDocument[];
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("docKind", kind.kind);
      form.append("file", file);
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove the file.");
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the file.");
    } finally {
      setBusy(false);
    }
  }

  const satisfied = documents.length > 0;

  return (
    <div className="rounded-[6px] border-[1.5px] border-black bg-white p-4">
      <div className="flex flex-wrap items-start gap-3">
        <span
          className={[
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-black text-[13px] font-semibold",
            satisfied ? "bg-primary" : "bg-white text-[#999]",
          ].join(" ")}
        >
          {satisfied ? "✓" : "↑"}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="card-title">{kind.label}</p>
            <span className={required ? "badge" : "badge badge-outline"}>
              {required ? "Required" : "Optional"}
            </span>
          </div>
          <p className="helper mt-1">{kind.hint}</p>

          {documents.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center gap-2 rounded-[4px] border-[1.5px] border-[#e5e5e5] bg-[#f5f5f5] px-3 py-2 text-[13px] tracking-[0.02em]"
                >
                  <a
                    href={`/api/documents/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium underline underline-offset-2"
                  >
                    {doc.original_name}
                  </a>
                  <span className="text-[#666]">{formatSize(doc.size_bytes)}</span>
                  <button
                    type="button"
                    onClick={() => remove(doc.id)}
                    disabled={busy}
                    className="ml-auto text-[11px] font-semibold uppercase tracking-[0.08em] text-danger disabled:opacity-50"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p className="mt-2 text-[13px] font-medium tracking-[0.03em] text-danger">{error}</p>}
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="btn btn-secondary px-4 py-2 text-[13px]"
          >
            {busy ? "Working…" : documents.length > 0 ? "Add another" : "Choose file"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DocumentUploader({
  requiredKinds,
  optionalKinds,
  documents,
}: {
  requiredKinds: readonly Kind[];
  optionalKinds: readonly Kind[];
  documents: UploadedDocument[];
}) {
  const router = useRouter();
  const byKind = (kind: string) => documents.filter((d) => d.doc_kind === kind);
  const refresh = () => router.refresh();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {requiredKinds.map((kind) => (
          <UploadRow
            key={kind.kind}
            kind={kind}
            required
            documents={byKind(kind.kind)}
            onChanged={refresh}
          />
        ))}
      </div>

      <div className="space-y-3 border-t-[1.5px] border-black pt-6">
        <p className="section-title mb-1">Previous employment (if applicable)</p>
        {optionalKinds.map((kind) => (
          <UploadRow
            key={kind.kind}
            kind={kind}
            required={false}
            documents={byKind(kind.kind)}
            onChanged={refresh}
          />
        ))}
      </div>

      <p className="helper">
        Accepted formats: PDF, JPG, PNG, WebP · Maximum 5 MB per file. Documents are stored securely
        and used only for payroll and statutory compliance.
      </p>
    </div>
  );
}

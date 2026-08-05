"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DocPage } from "@/content/blocks";
import type { DocType } from "@/lib/types";
import DocumentBody from "./document-body";
import SignatureInput from "./signature-input";

type Props = {
  docType: DocType;
  docTitle: string;
  pages: DocPage[];
  /** Empty for documents that are accepted by declaration rather than signed. */
  initialSignatures: Record<number, string>;
  initialAccepted: boolean;
  employeeName: string;
  employeeCode: string;
  consentText: string;
  /** True only for the appointment letter: every page carries its own signature. */
  requiresSignature: boolean;
  /** When set, shows a download link for this document. */
  downloadHref?: string;
};

export default function DocumentSigner({
  docType,
  docTitle,
  pages,
  initialSignatures,
  initialAccepted,
  employeeName,
  employeeCode,
  consentText,
  requiresSignature,
  downloadHref,
}: Props) {
  const router = useRouter();
  const [signatures, setSignatures] = useState<Record<number, string>>(initialSignatures);

  const startIndex = useMemo(() => {
    if (!requiresSignature) return 0;
    // Drop the employee on the first page they still have to sign.
    const firstUnsigned = pages.findIndex((p) => !initialSignatures[p.page]);
    return firstUnsigned === -1 ? pages.length - 1 : firstUnsigned;
  }, [requiresSignature, pages, initialSignatures]);

  const [index, setIndex] = useState(startIndex);
  // Policies aren't signed, so "have you been through it" is tracked by pages opened.
  // An already-accepted document counts as fully read.
  const [viewed, setViewed] = useState<Set<number>>(() =>
    initialAccepted ? new Set(pages.map((p) => p.page)) : new Set([pages[startIndex].page]),
  );
  const [consent, setConsent] = useState(initialAccepted);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = pages[index];
  const isLastPage = index === pages.length - 1;

  const signedCount = useMemo(
    () => pages.filter((p) => signatures[p.page]).length,
    [pages, signatures],
  );
  const allSigned = signedCount === pages.length;
  const allViewed = viewed.size === pages.length;
  /** What "you may submit now" means for this document. */
  const readyToSubmit = requiresSignature ? allSigned : allViewed;

  async function saveSignature(signatureText: string) {
    const res = await fetch("/api/signatures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ docType, pageNo: page.page, signatureText }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error ?? "Could not save your signature.");
    }
    setSignatures((prev) => ({ ...prev, [page.page]: signatureText }));
    router.refresh();
  }

  async function clearSignature() {
    const res = await fetch(
      `/api/signatures?docType=${encodeURIComponent(docType)}&pageNo=${page.page}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      setError("Could not remove the signature. Please try again.");
      return;
    }
    setSignatures((prev) => {
      const next = { ...prev };
      delete next[page.page];
      return next;
    });
    router.refresh();
  }

  async function submitDocument() {
    if (!readyToSubmit) {
      setError(
        requiresSignature
          ? "Please sign every page before submitting."
          : "Please open every page before accepting.",
      );
      return;
    }
    if (!consent) {
      setError("Please tick the declaration to confirm your acceptance.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/acceptance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Submission failed.");
      }
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  function goTo(next: number) {
    setIndex(next);
    setViewed((prev) => new Set(prev).add(pages[next].page));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const pendingCount = requiresSignature ? pages.length - signedCount : pages.length - viewed.size;

  return (
    <div className="space-y-6">
      {/* Page rail */}
      <div className="card no-print flex flex-wrap items-center gap-2 p-3">
        <span className="stat-label mr-1">Pages</span>
        {pages.map((p, i) => {
          const done = requiresSignature ? Boolean(signatures[p.page]) : viewed.has(p.page);
          const active = i === index;
          return (
            <button
              key={p.page}
              type="button"
              onClick={() => goTo(i)}
              title={p.title}
              className={[
                "flex h-8 w-8 items-center justify-center rounded-[4px] border-[1.5px] border-black text-[13px] font-semibold transition",
                active ? "bg-black text-primary" : done ? "bg-primary" : "bg-white hover:bg-[#ffc61a40]",
              ].join(" ")}
            >
              {done && !active ? "✓" : p.page}
            </button>
          );
        })}
        {downloadHref && (
          <a
            href={downloadHref}
            className="btn btn-secondary ml-auto px-4 py-2 text-[13px]"
          >
            ↓ Download PDF
          </a>
        )}
        <span className={`stat-label ${downloadHref ? "" : "ml-auto"}`}>
          {requiresSignature
            ? `${signedCount} of ${pages.length} pages signed`
            : `${viewed.size} of ${pages.length} pages read`}
        </span>
      </div>

      {/* The document page */}
      <article className="overflow-hidden rounded-[8px] border-[1.5px] border-black bg-white">
        <header className="border-b-[1.5px] border-black bg-primary px-6 py-5 sm:px-10">
          <p className="stat-label stat-label-dark">{docTitle}</p>
          <h2 className="section-title mt-1">{page.title}</h2>
          <p className="mt-1 text-[13px] tracking-[0.03em]">
            Page {page.page} of {pages.length} · {employeeName} ({employeeCode})
          </p>
        </header>

        <div className="px-6 py-6 sm:px-10 sm:py-8">
          <DocumentBody blocks={page.blocks} />
        </div>

        {requiresSignature && (
          <footer className="no-print border-t-[1.5px] border-black bg-[#f5f5f5] px-6 py-6 sm:px-10">
            <p className="helper mb-3">
              Sign this page to confirm you have read and understood its contents.
            </p>
            <SignatureInput
              value={signatures[page.page] ?? null}
              expectedName={employeeName}
              onSave={saveSignature}
              onClear={clearSignature}
              label={
                signatures[page.page]
                  ? `Signature recorded for page ${page.page}`
                  : `Type your full name to sign page ${page.page} of ${pages.length}`
              }
            />
          </footer>
        )}
      </article>

      {/* Final declaration */}
      {isLastPage && (
        <div className="card no-print">
          <h3 className="section-title">Declaration</h3>
          <label className="mt-3 flex cursor-pointer items-start gap-3 text-[14px] tracking-[0.02em]">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-[3px] border-[1.5px] border-black accent-[#ffc61a]"
            />
            <span>{consentText}</span>
          </label>
          {!readyToSubmit && (
            <p className="banner-note mt-3">
              {requiresSignature
                ? `You still have ${pendingCount} unsigned page${pendingCount > 1 ? "s" : ""}. Use the page numbers above to go back and sign them.`
                : `You still have ${pendingCount} page${pendingCount > 1 ? "s" : ""} left to read. Use the page numbers above to open them.`}
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="banner-danger">
          {error}
        </p>
      )}

      {/* Navigation */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link
            href="/onboarding"
            className="btn btn-secondary"
          >
            Save & exit
          </Link>
          {index > 0 && (
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="btn btn-secondary"
            >
              ← Previous page
            </button>
          )}
        </div>

        {isLastPage ? (
          <button
            type="button"
            onClick={submitDocument}
            disabled={submitting || !readyToSubmit || !consent}
            className="btn btn-primary"
          >
            {submitting
              ? "Submitting…"
              : initialAccepted
                ? "Update & finish"
                : requiresSignature
                  ? "Submit document"
                  : "Accept policy"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            disabled={requiresSignature && !signatures[page.page]}
            className="btn btn-primary"
            title={
              requiresSignature && !signatures[page.page] ? "Sign this page to continue" : undefined
            }
          >
            Next page →
          </button>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAcceptance,
  getDocuments,
  getKyc,
  getSignatureRows,
  getSteps,
  pagesFor,
} from "@/lib/onboarding";
import { getLetter } from "@/lib/letter";
import { ALL_DOC_KINDS, DOC_LABELS, REQUIRES_SIGNATURE, type DocType } from "@/lib/types";
import { maskId } from "@/lib/validation";
import { COMPANY, formatDate } from "@/content/company";

export default async function SummaryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [steps, kyc, documents, letter] = await Promise.all([
    getSteps(user),
    getKyc(user.id),
    getDocuments(user.id),
    getLetter(user.id),
  ]);
  const docTypes = Object.keys(DOC_LABELS) as DocType[];

  const docSections = await Promise.all(
    docTypes.map(async (docType) => {
      const total = (await pagesFor(docType, user)).length;
      if (!REQUIRES_SIGNATURE[docType]) {
        return { docType, total, kind: "acceptance" as const, acceptance: await getAcceptance(user.id, docType) };
      }
      return { docType, total, kind: "signatures" as const, rows: await getSignatureRows(user.id, docType) };
    }),
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Submission summary</h1>
          <p className="page-sub mt-1">
            A record of everything you have signed and submitted. Keep this for your reference.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="btn btn-secondary no-print"
        >
          ← Back to checklist
        </Link>
      </header>

      <section className="card">
        <h2 className="section-title mb-4">Employee</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ["Name", user.full_name],
            ["Employee code", user.employee_code],
            ["Email", user.email],
            ["Designation", user.designation],
            ["Department", user.department],
            ["Date of joining", formatDate(user.joining_date)],
            ["Work location", user.work_location],
            ["Reporting to", user.reporting_to],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="stat-label">{label}</dt>
              <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {letter && (
        <section className="card">
          <h2 className="section-title mb-4">Appointment letter</h2>
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["Letter reference", letter.letter_number],
              ["Designation on letter", letter.designation],
              ["Letter dated", formatDate(letter.issued_on)],
              ["Date of joining on letter", formatDate(letter.joining_date)],
              ["Prepared on", `${letter.generated_at} UTC`],
              [
                "Prepared by",
                letter.generated_by === "ai"
                  ? `AI-assisted (${letter.ai_model})`
                  : "Standard template",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="stat-label">{label}</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <a
            href="/api/letter/pdf"
            className="btn btn-primary no-print mt-5"
          >
            ↓ Download appointment letter (PDF)
          </a>
          <p className="banner-note mt-5">
            This letter was frozen when it was prepared. Its wording and both dates above stay fixed
            regardless of when you open or sign it.
          </p>
        </section>
      )}

      <section className="card">
        <h2 className="section-title mb-4">Checklist status</h2>
        <ul className="space-y-2 text-sm">
          {steps.map((step) => (
            <li key={step.id} className="flex items-center justify-between gap-3 border-b border-[#e5e5e5] py-2 last:border-0">
              <span className="text-[15px] font-medium">{step.title}</span>
              <span className={step.complete ? "badge badge-dark" : "badge badge-outline"}>
                {step.complete ? "Complete" : step.detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {docSections.map((section) => {
        if (section.kind === "acceptance") {
          return (
            <section key={section.docType} className="card">
              <h2 className="section-title mb-1">{DOC_LABELS[section.docType]}</h2>
              <p className="helper mb-3">{section.total} pages · accepted by declaration</p>
              {section.acceptance ? (
                <p className="text-[14px] font-medium tracking-[0.02em]">
                  ✓ Read and accepted on {section.acceptance.accepted_at} UTC ·{" "}
                  {section.acceptance.ip_address ?? "—"}
                </p>
              ) : (
                <p className="page-sub">Not accepted yet.</p>
              )}
            </section>
          );
        }

        return (
          <section key={section.docType} className="card">
            <h2 className="section-title mb-1">{DOC_LABELS[section.docType]}</h2>
            <p className="helper mb-4">
              {section.rows.length} of {section.total} pages signed
            </p>
            {section.rows.length === 0 ? (
              <p className="page-sub">Not signed yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.rows.map((row) => (
                  <figure key={row.page_no} className="rounded-[6px] border-[1.5px] border-black p-3">
                    <p className="signature-text flex h-16 items-center justify-center rounded-[4px] border border-[#e5e5e5] bg-white px-2 text-center text-lg">
                      {row.signature_text}
                    </p>
                    <figcaption className="helper mt-2 text-[12px]">
                      Page {row.page_no} · {row.signed_at} UTC · {row.ip_address ?? "—"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </section>
        );
      })}

      <section className="card">
        <h2 className="section-title mb-4">Identification details</h2>
        {!kyc?.submitted_at ? (
          <p className="page-sub">Not submitted yet.</p>
        ) : (
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {[
              ["PAN", maskId(kyc.pan_number)],
              ["Aadhaar", maskId(kyc.aadhaar_number)],
              ["UAN", maskId(kyc.uan_number)],
              ["PF number", kyc.pf_number || "—"],
              ["ESIC number", maskId(kyc.esic_number)],
              ["Bank", kyc.bank_name || "—"],
              ["Account number", maskId(kyc.account_number)],
              ["IFSC", kyc.ifsc_code || "—"],
              ["Emergency contact", `${kyc.emergency_name ?? "—"} (${kyc.emergency_relation ?? "—"})`],
              ["Emergency phone", maskId(kyc.emergency_phone)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="stat-label">{label}</dt>
                <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="card">
        <h2 className="section-title mb-4">Uploaded documents</h2>
        {documents.length === 0 ? (
          <p className="page-sub">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {documents.map((doc) => {
              const meta = ALL_DOC_KINDS.find((k) => k.kind === doc.doc_kind);
              return (
                <li
                  key={doc.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[#e5e5e5] py-2 last:border-0"
                >
                  <span className="text-[15px] font-semibold">{meta?.label ?? doc.doc_kind}</span>
                  <a
                    href={`/api/documents/${doc.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-[14px] underline underline-offset-2"
                  >
                    {doc.original_name}
                  </a>
                  <span className="helper ml-auto">{doc.uploaded_at} UTC</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="helper">
        Generated for {user.full_name} · {COMPANY.name}
      </p>
    </div>
  );
}

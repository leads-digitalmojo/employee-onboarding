import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { documentsStepComplete, getDocuments, getKyc } from "@/lib/onboarding";
import { OPTIONAL_DOC_KINDS, REQUIRED_DOC_KINDS } from "@/lib/types";
import KycForm from "@/components/kyc-form";
import DocumentUploader from "@/components/document-uploader";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [kyc, documents, status] = await Promise.all([
    getKyc(user.id),
    getDocuments(user.id),
    documentsStepComplete(user.id),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <span className="badge">Step 4 of 4</span>
        <h1 className="page-title mt-2">Identification &amp; Documents</h1>
        <p className="page-sub mt-1">
          These details are needed to register you for payroll, provident fund and statutory compliance.
          Make sure every entry matches your official documents exactly.
        </p>
      </header>

      <div className={status.complete ? "banner-yellow" : "banner-note"}>{status.detail}</div>

      <section className="card">
        <KycForm initial={kyc} />
      </section>

      <section className="card">
        <h2 className="section-title">Upload supporting documents</h2>
        <p className="page-sub mt-1 mb-5">
          Scans or clear photographs are acceptable, as long as all text is readable.
        </p>
        <DocumentUploader
          requiredKinds={REQUIRED_DOC_KINDS}
          optionalKinds={OPTIONAL_DOC_KINDS}
          documents={documents}
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/onboarding"
          className="btn btn-secondary"
        >
          ← Back to checklist
        </Link>
        {status.complete && (
          <Link
            href="/onboarding/summary"
            className="btn btn-primary"
          >
            View summary →
          </Link>
        )}
      </div>
    </div>
  );
}

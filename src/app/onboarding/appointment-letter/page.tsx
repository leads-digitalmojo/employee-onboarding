import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSignaturesForDoc, isAccepted, pagesFor } from "@/lib/onboarding";
import { getLetter } from "@/lib/letter";
import DocumentSigner from "@/components/document-signer";
import { COMPANY } from "@/content/company";

export default async function AppointmentLetterPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const letter = await getLetter(user.id);
  if (!letter) redirect("/onboarding/role");

  const [pages, initialSignatures, accepted] = await Promise.all([
    pagesFor("appointment_letter", user),
    getSignaturesForDoc(user.id, "appointment_letter"),
    isAccepted(user.id, "appointment_letter"),
  ]);

  return (
    <DocumentSigner
      docType="appointment_letter"
      docTitle={COMPANY.name}
      pages={pages}
      initialSignatures={initialSignatures}
      initialAccepted={accepted}
      employeeName={letter.full_name}
      consentText="I confirm that I have read and understood every page of this letter of appointment, that the digital signatures affixed above are mine, and that I accept the terms and conditions of employment set out in this letter."
      requiresSignature
      downloadHref="/api/letter/pdf"
    />
  );
}

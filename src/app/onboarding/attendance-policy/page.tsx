import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAccepted, pagesFor } from "@/lib/onboarding";
import DocumentSigner from "@/components/document-signer";

export default async function AttendancePolicyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [pages, accepted] = await Promise.all([
    pagesFor("attendance_policy", user),
    isAccepted(user.id, "attendance_policy"),
  ]);

  return (
    <DocumentSigner
      docType="attendance_policy"
      docTitle="Attendance Policy"
      pages={pages}
      initialSignatures={{}}
      initialAccepted={accepted}
      employeeName={user.full_name}
      consentText="I confirm that I have read and understood the Attendance Policy, including the Revised Late Coming Policy 2026 and the consequences of late arrival and unauthorised absence, and I agree to comply with it."
      requiresSignature={false}
    />
  );
}

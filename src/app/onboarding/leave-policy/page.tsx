import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAccepted, pagesFor } from "@/lib/onboarding";
import DocumentSigner from "@/components/document-signer";

export default async function LeavePolicyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [pages, accepted] = await Promise.all([
    pagesFor("leave_policy", user),
    isAccepted(user.id, "leave_policy"),
  ]);

  return (
    <DocumentSigner
      docType="leave_policy"
      docTitle="Leave, Work & Rewards Policy — 2026"
      pages={pages}
      initialSignatures={{}}
      initialAccepted={accepted}
      employeeName={user.full_name}
      employeeCode={user.employee_code}
      consentText="I confirm that I have read and understood the Leave, Work & Rewards Policy 2026 in full — including the work structure, leave entitlements, the Work From Home rules and the criteria for the Special Rewards Program — and I agree to apply for and avail leave and WFH in accordance with it."
      requiresSignature={false}
    />
  );
}

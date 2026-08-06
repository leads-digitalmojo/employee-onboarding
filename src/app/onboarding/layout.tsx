import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getSteps } from "@/lib/onboarding";
import { COMPANY } from "@/content/company";
import Logo from "@/components/logo";
import { logoutAction } from "../login/actions";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const steps = await getSteps(user);
  const done = steps.filter((s) => s.complete).length;
  const percent = Math.round((done / steps.length) * 100);

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-10 border-b-[1.5px] border-black bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <Link href="/onboarding" className="flex items-center gap-2.5">
            <Logo height={26} />
            <span className="brand">{COMPANY.name} Onboarding</span>
          </Link>

          <div className="ml-auto flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-[15px] font-semibold">{user.full_name}</p>
              <p className="helper">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn btn-secondary px-4 py-2 text-[13px]">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 pb-3">
          <div className="h-3 flex-1 overflow-hidden rounded-[4px] border-[1.5px] border-black bg-white">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="stat-label">
            {done} of {steps.length} complete
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 pb-6">{children}</main>

      <footer className="no-print border-t-[1.5px] border-black py-6 text-center">
        <p className="helper">
          {COMPANY.name} · Need help? {COMPANY.hrEmail}
        </p>
      </footer>
    </div>
  );
}

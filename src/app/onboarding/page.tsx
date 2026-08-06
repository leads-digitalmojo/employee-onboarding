import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getSteps } from "@/lib/onboarding";
import { getLetter } from "@/lib/letter";
import { formatDate } from "@/content/company";

export default async function OnboardingDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // First login: the letter has to exist before there is a checklist to show.
  const letter = await getLetter(user.id);
  if (!letter) redirect("/onboarding/role");

  const steps = await getSteps(user);
  const remaining = steps.filter((s) => !s.complete);
  const allDone = remaining.length === 0;
  const done = steps.length - remaining.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="page-title">Welcome, {user.full_name.split(" ")[0]}</h1>
        <p className="page-sub mt-1">
          Joining as {letter.designation}, {letter.department} · Starting{" "}
          {formatDate(letter.joining_date)}
        </p>
      </header>

      {/* Stat boxes */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="stat-num">{done}</p>
          <p className="stat-label mt-1">Steps completed</p>
        </div>
        <div className="card">
          <p className="stat-num">{remaining.length}</p>
          <p className="stat-label mt-1">Steps remaining</p>
        </div>
        <div className="card">
          <p className="stat-num">{Math.round((done / steps.length) * 100)}%</p>
          <p className="stat-label mt-1">Overall progress</p>
        </div>
      </section>

      {allDone && (
        <div className="banner-yellow">
          Onboarding complete. People Operations will verify your documents and get in touch within
          two working days.{" "}
          <Link href="/onboarding/summary" className="font-semibold underline underline-offset-2">
            View submission summary
          </Link>
        </div>
      )}

      {/* Checklist */}
      <section className="space-y-4">
        <h2 className="section-title">Your checklist</h2>

        {steps.map((step, i) => (
          <Link key={step.id} href={step.href} className="card card-click block">
            <div className="flex flex-wrap items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-black bg-primary text-[15px] font-semibold">
                {step.complete ? "✓" : i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="card-title">{step.title}</h3>
                  <span className={step.complete ? "badge badge-dark" : "badge badge-outline"}>
                    {step.complete ? "Complete" : "Pending"}
                  </span>
                </div>
                <p className="helper mt-1">{step.description}</p>
                <p className="mt-2 text-[13px] font-medium tracking-[0.03em]">{step.detail}</p>
              </div>

              <span className="self-center text-xl">›</span>
            </div>
          </Link>
        ))}
      </section>

      {!allDone && (
        <p className="page-sub">
          Next up:{" "}
          <Link href={remaining[0].href} className="font-semibold text-black underline underline-offset-2">
            {remaining[0].title}
          </Link>
        </p>
      )}
    </div>
  );
}

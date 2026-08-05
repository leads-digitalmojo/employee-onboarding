import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLetter } from "@/lib/letter";
import { ROLES } from "@/content/roles";
import { formatDate } from "@/content/company";
import RoleForm from "./role-form";

export default async function RolePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (await getLetter(user.id)) redirect("/onboarding/appointment-letter");

  return (
    <div className="space-y-8">
      <header>
        <span className="badge">First step</span>
        <h1 className="page-title mt-2">
          Welcome, {user.full_name.split(" ")[0]}
        </h1>
        <p className="page-sub mt-1">
          Confirm the role you have been appointed to and we will prepare your appointment letter.
          Everything else is taken from your employee record.
        </p>
      </header>

      <section className="card">
        <h2 className="section-title mb-4">Your record</h2>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ["Date of joining", formatDate(user.joining_date)],
            ["Work location", user.work_location],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="stat-label">{label}</dt>
              <dd className="mt-0.5 text-[15px] font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="banner-note mt-5">
          Your date of joining is fixed by People Operations and is not affected by when you log in or
          sign. If any detail above is wrong, contact People Operations before continuing.
        </p>
      </section>

      <section className="card">
        <h2 className="section-title mb-1">Select your role</h2>
        <p className="page-sub mb-5">
          This determines the designation, department and responsibilities recorded in your letter.
        </p>
        <RoleForm roles={ROLES} />
      </section>
    </div>
  );
}

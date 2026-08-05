import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { COMPANY } from "@/content/company";
import Logo from "@/components/logo";
import LoginForm from "./login-form";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/onboarding");

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Logo height={32} />
          <span className="brand">{COMPANY.name}</span>
        </div>

        <div className="card">
          <h1 className="page-title">Onboarding</h1>
          <p className="page-sub mt-1 mb-6">
            Sign in with your @digitalmojo.in Google account to complete your joining formalities.
          </p>
          <LoginForm />
        </div>

        <p className="helper mt-4 text-center">Trouble signing in? {COMPANY.hrEmail}</p>
      </div>
    </main>
  );
}

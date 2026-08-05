import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import "./globals.css";
import { COMPANY } from "@/content/company";

// League Spartan across the whole product — no second family anywhere.
// Loaded via next/font so it is self-hosted at build time.
const league = League_Spartan({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-league",
  display: "swap",
});

export const metadata: Metadata = {
  title: `Onboarding — ${COMPANY.name}`,
  description: "Sign your appointment letter, accept company policies and submit your documents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={league.variable}>
      {/* suppressHydrationWarning: some browser extensions inject a style
          attribute onto <body> before React hydrates. We never set one
          ourselves, so this only silences that known false positive. */}
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

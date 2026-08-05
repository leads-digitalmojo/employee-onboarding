"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { generateLetter, getLetter } from "@/lib/letter";
import { findRole } from "@/content/roles";

export type RoleState = { error?: string };

export async function selectRoleAction(_prev: RoleState, formData: FormData): Promise<RoleState> {
  const user = await requireUser();

  // Already generated — never regenerate, even if this form is re-submitted.
  if (await getLetter(user.id)) redirect("/onboarding/appointment-letter");

  const roleKey = String(formData.get("role_key") ?? "");
  if (!findRole(roleKey)) {
    return { error: "Please choose the role you have been appointed to." };
  }

  await generateLetter(user, roleKey);
  redirect("/onboarding/appointment-letter");
}

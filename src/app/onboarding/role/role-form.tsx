"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Role } from "@/content/roles";
import { selectRoleAction, type RoleState } from "./actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="btn btn-primary"
    >
      {pending ? "Preparing your letter…" : "Generate my appointment letter"}
    </button>
  );
}

export default function RoleForm({ roles }: { roles: Role[] }) {
  const [state, formAction] = useActionState<RoleState, FormData>(selectRoleAction, {});
  const [selected, setSelected] = useState<string>("");

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <label
            key={role.key}
            className={[
              "card card-click p-4",
              selected === role.key ? "bg-primary" : "",
            ].join(" ")}
          >
            <input
              type="radio"
              name="role_key"
              value={role.key}
              checked={selected === role.key}
              onChange={(e) => setSelected(e.target.value)}
              className="sr-only"
            />
            <span className="card-title block">{role.designation}</span>
            <span className="stat-label mt-1 block">{role.department}</span>
          </label>
        ))}
      </div>

      {state.error && (
        <p role="alert" className="banner-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton disabled={!selected} />
        <span className="helper">
          Your letter is prepared once and cannot be changed afterwards.
        </span>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { KycDetails } from "@/lib/types";
import { validateKyc, type KycInput } from "@/lib/validation";

const BLANK: KycInput = {
  pan_number: "",
  aadhaar_number: "",
  uan_number: "",
  pf_number: "",
  esic_number: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
  emergency_name: "",
  emergency_phone: "",
  emergency_relation: "",
};

type FieldProps = {
  name: keyof KycInput;
  label: string;
  value: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  uppercase?: boolean;
  onChange: (name: keyof KycInput, value: string) => void;
};

function Field({
  name,
  label,
  value,
  error,
  hint,
  placeholder,
  required,
  maxLength,
  uppercase,
  onChange,
}: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(name, uppercase ? e.target.value.toUpperCase() : e.target.value)}
        className={["field", uppercase ? "uppercase" : "", error ? "field-error" : ""].join(" ")}
      />
      {error ? (
        <p className="mt-1 text-[13px] font-medium tracking-[0.03em] text-danger">{error}</p>
      ) : hint ? (
        <p className="helper mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

export default function KycForm({ initial }: { initial: KycDetails | null }) {
  const router = useRouter();
  const [values, setValues] = useState<KycInput>({
    ...BLANK,
    ...Object.fromEntries(
      (Object.keys(BLANK) as (keyof KycInput)[]).map((k) => [k, initial?.[k] ?? ""]),
    ),
  } as KycInput);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(initial?.submitted_at));
  const [message, setMessage] = useState<string | null>(null);

  function update(name: keyof KycInput, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setSaved(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const clientErrors = validateKyc(values);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      setMessage("Please correct the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(body.errors ?? {});
        setMessage(body.error ?? "Could not save your details.");
        return;
      }
      setSaved(true);
      setMessage("Your identification details have been saved.");
      router.refresh();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="section-title">Statutory identification</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="pan_number"
            label="PAN number"
            value={values.pan_number}
            error={errors.pan_number}
            hint="10 characters, e.g. ABCDE1234F"
            placeholder="ABCDE1234F"
            maxLength={10}
            uppercase
            required
            onChange={update}
          />
          <Field
            name="aadhaar_number"
            label="Aadhaar number"
            value={values.aadhaar_number}
            error={errors.aadhaar_number}
            hint="12 digits, no spaces"
            placeholder="123456789012"
            maxLength={12}
            required
            onChange={update}
          />
          <Field
            name="uan_number"
            label="UAN (Universal Account Number)"
            value={values.uan_number}
            error={errors.uan_number}
            hint="12 digits. Leave blank if this is your first job."
            placeholder="100123456789"
            maxLength={12}
            onChange={update}
          />
          <Field
            name="pf_number"
            label="PF account number"
            value={values.pf_number}
            error={errors.pf_number}
            hint="Optional — from your previous employer"
            placeholder="MH/BAN/0012345/000/0001234"
            maxLength={40}
            onChange={update}
          />
          <Field
            name="esic_number"
            label="ESIC number"
            value={values.esic_number}
            error={errors.esic_number}
            hint="Optional — only if you were covered under ESIC"
            placeholder="1234567890"
            maxLength={20}
            onChange={update}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t-[1.5px] border-black pt-6">
        <legend className="section-title">Salary account</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="bank_name"
            label="Bank name"
            value={values.bank_name}
            error={errors.bank_name}
            placeholder="HDFC Bank"
            maxLength={80}
            required
            onChange={update}
          />
          <Field
            name="account_number"
            label="Account number"
            value={values.account_number}
            error={errors.account_number}
            hint="9–18 digits"
            placeholder="50100123456789"
            maxLength={18}
            required
            onChange={update}
          />
          <Field
            name="ifsc_code"
            label="IFSC code"
            value={values.ifsc_code}
            error={errors.ifsc_code}
            hint="11 characters, e.g. HDFC0001234"
            placeholder="HDFC0001234"
            maxLength={11}
            uppercase
            required
            onChange={update}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4 border-t-[1.5px] border-black pt-6">
        <legend className="section-title">Emergency contact</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            name="emergency_name"
            label="Full name"
            value={values.emergency_name}
            error={errors.emergency_name}
            placeholder="Sunita Sharma"
            maxLength={80}
            required
            onChange={update}
          />
          <Field
            name="emergency_relation"
            label="Relationship"
            value={values.emergency_relation}
            error={errors.emergency_relation}
            placeholder="Mother"
            maxLength={40}
            required
            onChange={update}
          />
          <Field
            name="emergency_phone"
            label="Mobile number"
            value={values.emergency_phone}
            error={errors.emergency_phone}
            hint="10 digits"
            placeholder="9876543210"
            maxLength={10}
            required
            onChange={update}
          />
        </div>
      </fieldset>

      {message && (
        <p
          role="status"
          className={saved ? "banner-yellow" : "banner-danger"}
        >
          {message}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "Saving…" : saved ? "Update details" : "Save details"}
        </button>
        {saved && <span className="badge badge-dark">Saved</span>}
      </div>
    </form>
  );
}

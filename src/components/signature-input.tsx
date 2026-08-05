"use client";

import { useState } from "react";

type Props = {
  /** The signature already recorded for this page, if any. */
  value?: string | null;
  /** The employee's name as held on record — what they must type. */
  expectedName: string;
  onSave: (text: string) => Promise<void> | void;
  onClear?: () => Promise<void> | void;
  label?: string;
};

/** Ignores case and extra spacing, so "priya  sharma" matches "Priya Sharma". */
function normalise(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function namesMatch(typed: string, expected: string): boolean {
  return normalise(typed) === normalise(expected);
}

export default function SignatureInput({ value, expectedName, onSave, onClear, label }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const typed = text.trim();
    if (!typed) {
      setError("Type your full name to sign this page.");
      return;
    }
    if (!namesMatch(typed, expectedName)) {
      setError(`Your signature must match the name on your record: ${expectedName}`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(typed);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your signature. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (value) {
    return (
      <div className="rounded-[6px] border-[1.5px] border-black bg-primary p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="stat-label stat-label-dark">{label ?? "Signed"}</p>
          {onClear && (
            <button
              type="button"
              onClick={() => onClear()}
              className="text-[13px] font-medium tracking-[0.06em] uppercase underline underline-offset-2"
            >
              Sign again
            </button>
          )}
        </div>
        <p className="signature-text rounded-[6px] border-[1.5px] border-black bg-white px-4 py-3 text-2xl">
          {value}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[6px] border-[1.5px] border-black bg-white p-4">
      <label htmlFor="signature" className="label">
        {label ?? "Type your full name to sign"}
      </label>
      <input
        id="signature"
        type="text"
        value={text}
        autoComplete="off"
        spellCheck={false}
        placeholder={expectedName}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
          }
        }}
        className="field signature-text py-3 text-2xl"
      />
      {error && (
        <p role="alert" className="mt-2 text-[13px] font-medium tracking-[0.03em] text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "Saving…" : "Sign this page"}
        </button>
        <span className="helper">
          Typing your name here is your signature and is legally binding.
        </span>
      </div>
    </div>
  );
}

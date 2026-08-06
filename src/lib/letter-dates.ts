/**
 * Date rules for the appointment letter. Pure and dependency-free so they can be
 * exercised directly — these are the rules that stop a letter from re-dating
 * itself, so they are worth being able to test in isolation.
 */

export type LetterDateSource = {
  /** Date of joining, as set by HR. The authoritative fact. */
  joiningDate: string;
  /** Explicit issue date set by HR, if any. */
  letterIssueDate?: string | null;
  /** When the employee record was provisioned. */
  createdAt?: string | null;
};

/**
 * Resolves the date printed on the letter.
 *
 * Deliberately takes no clock: nothing here reads `new Date()`. If it did, an
 * employee who joined on the 1st but first logged in on the 4th would get a
 * letter dated the 4th — and a different date again on every later visit.
 *
 * Order of preference:
 *   1. The issue date HR set explicitly.
 *   2. The date the record was provisioned, clamped to the joining date so a
 *      letter is never dated after the joining it announces (which happens when
 *      HR backfills a record for someone who has already started).
 */
export function resolveIssueDate(src: LetterDateSource): string {
  const joining = src.joiningDate.slice(0, 10);

  const explicit = src.letterIssueDate?.slice(0, 10);
  if (explicit) return explicit;

  const provisioned = (src.createdAt ?? joining).slice(0, 10);
  return provisioned > joining ? joining : provisioned;
}

export function buildLetterNumber(prefix: string, userId: string, issuedOn: string): string {
  return `${prefix.toUpperCase()}/APPT/${issuedOn.slice(0, 4)}/${userId.slice(0, 8).toUpperCase()}`;
}

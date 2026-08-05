export const COMPANY = {
  name: "Digital Mojo",
  shortName: "Digital Mojo",
  hrEmail: "hr@digitalmojo.example",
  hrPhone: "+91 40 4000 1200",
  signatoryName: "K. Lahari",
  signatoryTitle: "HR Executive",
  workWeek: "Monday to Friday",
  shiftStart: "10:00 AM",
  shiftEnd: "7:00 PM",
  /** Every Second Saturday is a working day, on shorter hours. */
  secondSaturdayStart: "11:00 AM",
  secondSaturdayEnd: "5:00 PM",
  /** Attendance marked after this time is a late arrival — there is no grace period. */
  lateAfter: "10:05 AM",
  /** Late arrivals up to this time count towards the 3 free late arrivals each month. */
  lateFreeUntil: "10:30 AM",
  freeLateArrivals: 3,
  coreHours: "11:00 AM – 4:00 PM IST",
};

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/** The letter writes the joining date as D/M/Y, matching the printed template. */
export function formatDMY(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

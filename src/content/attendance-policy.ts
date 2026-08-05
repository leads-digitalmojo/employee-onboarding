import type { DocPage } from "./blocks";
import { COMPANY } from "./company";

export const ATTENDANCE_POLICY_PAGES: DocPage[] = [
  {
    page: 1,
    title: "Attendance Policy — Office Timing",
    blocks: [
      {
        type: "p",
        text: `This policy sets out the attendance expectations for all employees of ${COMPANY.name}. It applies from your date of joining, including during probation.`,
      },
      { type: "h", text: "1. Office Timing" },
      {
        type: "p",
        text: `All teams must be present in the office sharp at ${COMPANY.shiftStart}.`,
      },
      {
        type: "table",
        head: ["Particular", "Standard"],
        rows: [
          ["Work week", `${COMPANY.workWeek} (5-day week)`],
          [
            "Every Second Saturday",
            `Working day, ${COMPANY.secondSaturdayStart} – ${COMPANY.secondSaturdayEnd} — no leave or WFH`,
          ],
          ["Reporting time", `${COMPANY.shiftStart} sharp`],
          ["Shift timing", `${COMPANY.shiftStart} – ${COMPANY.shiftEnd} IST`],
          ["Core hours (mandatory availability)", COMPANY.coreHours],
          ["Grace period", "None"],
          ["Marked late after", COMPANY.lateAfter],
        ],
      },
      { type: "h", text: "2. Marking Attendance" },
      {
        type: "ol",
        items: [
          "Attendance is captured through access-card swipes at the office and through the HR portal when working remotely.",
          "You must record both a check-in and a check-out. A missing check-out is treated as a half-day.",
          "Marking attendance on behalf of another employee is a serious act of misconduct and may result in termination.",
        ],
      },
      {
        type: "note",
        text: `There is no grace time beyond ${COMPANY.shiftStart}. Attendance marked after ${COMPANY.lateAfter} will be treated as late — including by even one minute.`,
      },
    ],
  },
  {
    page: 2,
    title: "Revised Late Coming Policy (2026)",
    blocks: [
      { type: "h", text: "3. No Grace Period" },
      {
        type: "ul",
        items: [
          `There is no grace time beyond ${COMPANY.shiftStart}.`,
          `Attendance marked after ${COMPANY.lateAfter} will be treated as Late.`,
        ],
      },
      { type: "h", text: "4. Late Coming Consequence" },
      {
        type: "ul",
        items: [
          `${COMPANY.freeLateArrivals} late arrivals in a month till ${COMPANY.lateFreeUntil} = No Loss of Pay.`,
          "Every additional late arrival = ½ day Loss of Pay (LOP).",
          `Late arrival includes even 1 minute after ${COMPANY.lateAfter}.`,
        ],
      },
      {
        type: "table",
        head: ["Late Arrivals in a Month", "Consequence"],
        rows: [
          [`1 – ${COMPANY.freeLateArrivals} (up to ${COMPANY.lateFreeUntil})`, "No Loss of Pay"],
          [`Every arrival beyond ${COMPANY.freeLateArrivals}`, "½ day Loss of Pay, each occurrence"],
          ["Repeated late coming despite deductions", "Formal disciplinary action"],
        ],
      },
      { type: "h", text: "5. No Regularization" },
      {
        type: "ul",
        items: [
          "Late coming will not be regularized under any circumstances.",
          "Staying late, workload, or client calls will not offset late arrival unless approved in writing.",
        ],
      },
      { type: "h", text: "6. Exceptions" },
      {
        type: "ul",
        items: [
          "Only medical emergencies or management-approved exceptions (prior written approval) will be considered.",
          "Traffic, weather, personal reasons, or transport delays will not be accepted.",
        ],
      },
      { type: "h", text: "7. Accountability" },
      {
        type: "p",
        text: "Repeated late coming despite deductions may lead to formal disciplinary action.",
      },
      {
        type: "note",
        text: "By signing this page you confirm that you have read and understood the Revised Late Coming Policy (2026) and accept the deductions and consequences set out above.",
      },
    ],
  },
  {
    page: 3,
    title: "Attendance Policy — Absence, Remote Work and Compliance",
    blocks: [
      { type: "h", text: "8. Half Day and Absence" },
      {
        type: "ul",
        items: [
          "Working fewer than 8 hours but at least 4 hours on a day is recorded as a half day.",
          "Working fewer than 4 hours is recorded as a full-day absence.",
          "Two half days are adjusted against one day of the applicable leave balance.",
        ],
      },
      { type: "h", text: "9. Unauthorised Absence" },
      {
        type: "ol",
        items: [
          "Any absence without prior approved leave is unauthorised and is recorded as Leave Without Pay.",
          "If you are unable to report to work, you must inform your reporting manager before 10:00 AM on the same day.",
          "Three consecutive days of unauthorised absence attracts a written warning.",
          "Five or more consecutive days of unauthorised absence without intimation may be treated as voluntary abandonment of employment, and the Company may proceed to close your employment record after due notice to your registered address.",
        ],
      },
      { type: "h", text: "10. Compensatory Off" },
      {
        type: "p",
        text: "Comp Off is granted only where a team member is officially instructed to work on a Fixed National Holiday or an approved weekly off day, and must be approved in advance by the reporting manager. It must be availed within 30 days of being earned, cannot be encashed or carried forward, and cannot be clubbed with WFH. Full terms are set out in the Leave, Work & Rewards Policy. A Comp Off does not offset a late arrival.",
      },
      { type: "h", text: "11. Work From Home" },
      {
        type: "ul",
        items: [
          "WFH is subject to approval and is limited to 1 day per month. WFH on Mondays and Fridays is not allowed. The full WFH rules are set out in the Leave, Work & Rewards Policy.",
          "WFH days require a stable internet connection and availability on Company communication channels throughout core hours.",
          `Reporting time applies to WFH days as well — attendance must be marked in the HR portal by ${COMPANY.shiftStart}.`,
          "Working from a location outside India requires prior written approval from People Operations for tax and immigration reasons.",
        ],
      },
      { type: "h", text: "12. Monitoring and Records" },
      {
        type: "p",
        text: "The Company maintains attendance records for statutory compliance and payroll processing. Records are retained for a minimum of 8 years as required under applicable labour legislation. You may request a copy of your own attendance record at any time from People Operations.",
      },
      { type: "h", text: "13. Payroll Cut-off" },
      {
        type: "p",
        text: "The attendance cycle runs from the 21st of a month to the 20th of the following month. Leave approvals must be completed by the 21st; changes after the cut-off are adjusted in the subsequent payroll cycle.",
      },
      {
        type: "note",
        text: `By signing this page you confirm that you have read and understood the attendance requirements and agree to comply with them. Clarifications may be sought from ${COMPANY.hrEmail} or ${COMPANY.hrPhone}.`,
      },
    ],
  },
];

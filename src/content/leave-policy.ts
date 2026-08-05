import type { DocPage } from "./blocks";
import { COMPANY } from "./company";

export const LEAVE_POLICY_PAGES: DocPage[] = [
  {
    page: 1,
    title: "Work Structure & Leave Entitlements",
    blocks: [
      {
        type: "p",
        text: `This policy applies to all team members of ${COMPANY.name}. The leave year runs from 1 January to 31 December.`,
      },
      { type: "h", text: "1. Work Structure" },
      {
        type: "ul",
        items: [
          "The organization follows a 5-day working week (Monday–Friday).",
          `The 2nd Saturday of every month is a mandatory working day for Mojo Pulse and AI / Capability Training, from ${COMPANY.secondSaturdayStart} to ${COMPANY.secondSaturdayEnd}.`,
          "No leave or WFH can be applied on the 2nd Saturday.",
        ],
      },
      { type: "h", text: "2. Leave Entitlements (Annual)" },
      {
        type: "table",
        head: ["Leave Type", "Days per Year"],
        rows: [
          ["Casual / Sick Leave (CL/SL)", "12"],
          ["Fixed National Holidays", "3"],
          ["Personal Choice Holidays (PCH)", "6"],
          ["Birthday Leave", "1"],
          ["Vacation Leave", "5"],
          ["Total Annual Leave", "27"],
        ],
      },
      { type: "h", text: "A. Casual / Sick Leave (CL/SL) — 12 Days" },
      {
        type: "ul",
        items: [
          "12 days per calendar year (1 per month).",
          "Intended for personal, health, or urgent needs.",
          "Prior intimation expected where possible.",
        ],
      },
      { type: "h", text: "B. Fixed National Holidays — 3 Days" },
      { type: "p", text: "The organization remains closed on:" },
      { type: "ul", items: ["Republic Day", "Independence Day", "Gandhi Jayanti"] },
      {
        type: "p",
        text: "These are fixed holidays and cannot be substituted or carried forward.",
      },
      { type: "h", text: "C. Personal Choice Holidays (PCH) — 6 Days" },
      {
        type: "ul",
        items: [
          "Team members may choose up to 6 PCH based on personal, regional, or religious celebrations.",
          "Must be selected from the official PCH list shared annually.",
          "Must be applied at least 3 days in advance.",
          "Approval subject to work commitments.",
        ],
      },
    ],
  },
  {
    page: 2,
    title: "Birthday Leave, Vacation Leave & Total Entitlement",
    blocks: [
      { type: "h", text: "D. Birthday Leave — 1 Day" },
      {
        type: "ul",
        items: [
          "One fixed birthday leave per year.",
          "Must be applied at least 3 days in advance.",
          "Cannot be carried forward.",
        ],
      },
      { type: "h", text: "E. Vacation Leave — 5 Days" },
      {
        type: "ul",
        items: [
          "Designed to allow extended breaks when combined with weekends.",
          "Must be applied at least 15 days in advance.",
          "Cannot be applied on the 2nd Saturday.",
          "Approval depends on team coverage and client commitments.",
        ],
      },
      {
        type: "note",
        text: "Total Annual Leave: 27 Days.",
      },
      { type: "h", text: "Notice Requirements at a Glance" },
      {
        type: "table",
        head: ["Leave Type", "Advance Notice", "Carry Forward"],
        rows: [
          ["Casual / Sick Leave", "Prior intimation where possible", "Not permitted"],
          ["Personal Choice Holiday", "At least 3 days", "Not permitted"],
          ["Birthday Leave", "At least 3 days", "Not permitted"],
          ["Vacation Leave", "At least 15 days", "Not permitted"],
          ["Fixed National Holidays", "Not applicable — organization closed", "Not permitted"],
        ],
      },
      {
        type: "p",
        text: "Leave is not a right and must be approved before it is availed. Approval is subject to business continuity, team coverage and client commitments. A leave request that receives no response is not deemed approved.",
      },
    ],
  },
  {
    page: 3,
    title: "Work From Home (WFH) Policy",
    blocks: [
      { type: "h", text: "3A. WFH Allowance" },
      {
        type: "ul",
        items: [
          "WFH is subject to approval.",
          "1 WFH day per month is permitted.",
          "Unused WFH days do not carry forward.",
          "Any WFH beyond the monthly limit will be treated as Leave (Half Day).",
        ],
      },
      { type: "h", text: "3B. WFH Restrictions" },
      {
        type: "ul",
        items: [
          "WFH on Mondays and Fridays is not allowed.",
          "Final approval lies with management.",
          "Work output and responsiveness must not be compromised.",
        ],
      },
      { type: "h", text: "3C. WFH & Leave Clubbing" },
      {
        type: "ul",
        items: [
          "WFH cannot be clubbed with any type of leave (CL, SL, PCH, Birthday, Vacation).",
          "Any instance of WFH + Leave clubbing during the year will impact reward eligibility.",
        ],
      },
      { type: "h", text: "3D. WFH on Holidays" },
      {
        type: "ul",
        items: [
          "WFH on Fixed National Holidays or approved PCH is not permitted.",
          "Any violation will impact reward eligibility.",
        ],
      },
      { type: "h", text: "3E. Compensatory Off (Comp Off)" },
      {
        type: "p",
        text: "Comp Off may be granted only when a team member is officially instructed to work on Fixed National Holidays, or approved weekly off days.",
      },
      {
        type: "ul",
        items: [
          "Comp Off must be approved in advance by the reporting manager.",
          "Comp Off must be availed within 30 days of being earned.",
          "Comp Off cannot be encashed or carried forward.",
          "Comp Off is not counted as Leave (used or unused) and does not affect reward eligibility, provided all WFH and attendance rules are followed.",
          "Comp Off cannot be clubbed with WFH.",
        ],
      },
    ],
  },
  {
    page: 4,
    title: "Special Rewards Program — 2026",
    blocks: [
      { type: "h", text: "4. Eligibility" },
      {
        type: "ul",
        items: [
          "Team members must have completed 12 full months with the organization.",
          "Reward assessment is done once per year (Jan–Dec).",
          "Reward is never given mid-year.",
        ],
      },
      { type: "h", text: "Reward" },
      {
        type: "note",
        text: "₹25,000 Cash Reward",
      },
      { type: "h", text: "Reward Criteria (all conditions must be met)" },
      {
        type: "ol",
        items: [
          "Minimum 17 unused leaves in the calendar year (out of 27 total leaves).",
          "No violation of WFH policy.",
          "WFH not exceeding 1 day per month.",
          "No WFH + Leave clubbing at any point during the year.",
          "No WFH on holidays.",
          "No more than 6 late comings in the calendar year.",
          "No pattern of habitual late coming in any single month.",
        ],
      },
      {
        type: "p",
        text: "This reward is meant for exceptional discipline and consistency, not general entitlement.",
      },
      {
        type: "note",
        text: `Late coming is assessed under the Revised Late Coming Policy (2026), set out in the Attendance Policy. Questions about this policy should be directed to ${COMPANY.hrEmail}.`,
      },
    ],
  },
];

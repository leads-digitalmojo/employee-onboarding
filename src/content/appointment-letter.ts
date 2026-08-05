import type { DocPage } from "./blocks";
import { COMPANY, formatDate, formatDMY } from "./company";

/**
 * The Digital Mojo appointment letter, reproduced verbatim from the approved
 * template. The clause text, numbering, wording and page breaks match the
 * printed letter — only the three placeholders are filled in:
 *
 *   "Candidate Name" -> fullName
 *   "Role Name"      -> designation
 *   "D/M/Y"          -> joiningDate
 *
 * Do not reword, reorder, merge or add clauses here. If the letter changes,
 * change it in the approved template first and mirror it exactly.
 */
export type LetterInput = {
  fullName: string;
  designation: string;
  /** Date of joining, as set by HR. Never inferred from login or generation time. */
  joiningDate: string;
  /** The date against the authorised signatory. Frozen at generation. */
  issuedOn: string;
};

export function appointmentLetterPages(input: LetterInput): DocPage[] {
  return [
    {
      page: 1,
      title: "Appointment Letter",
      blocks: [
        { type: "logo" },
        { type: "p", text: "Personal & Confidential" },
        { type: "p", text: `Dear ${input.fullName},` },
        {
          type: "p",
          text: `With reference to the discussions held, we are pleased to appoint you as ${input.designation} at ${COMPANY.name}, subject to the following terms and conditions:`,
        },

        { type: "h", text: "1. Date of Joining" },
        { type: "p", text: `Your date of joining will be ${formatDMY(input.joiningDate)}.` },

        { type: "h", text: "2. Working Hours" },
        {
          type: "p",
          text: `Working hours shall be from ${COMPANY.shiftStart} to ${COMPANY.shiftEnd}, ${COMPANY.workWeek}.\nEvery Second Saturday shall be a working day from ${COMPANY.secondSaturdayStart} to ${COMPANY.secondSaturdayEnd}.`,
        },

        { type: "h", text: "3. Compensation" },
        {
          type: "p",
          text: "Your compensation and benefits shall be as discussed and communicated separately.\nAll payments are subject to applicable statutory deductions as per law.",
        },

        { type: "h", text: "4. Probation & Exit During Probation" },
        {
          type: "p",
          text: "You will be on probation for a period of three (3) months from the date of joining. Upon completion of the probation period, your services shall be automatically confirmed without the need for any further communication, unless otherwise notified in writing prior to the completion of probation.",
        },
        {
          type: "p",
          text: "The management reserves the absolute right to reduce, dispense with, or extend the probation period based on performance and business requirements.",
        },
        {
          type: "p",
          text: "In the event of a voluntary exit by the employee during probation, compensation shall be limited strictly to days actually worked, subject to attendance and completion of basic handover, if applicable.",
        },
      ],
    },

    {
      page: 2,
      title: "Service Commitment, Early Exit and Notice",
      blocks: [
        { type: "h", text: "5. Mandatory Minimum Service Commitment (Post-Confirmation)" },
        {
          type: "p",
          text: "Upon confirmation, the employee commits to a mandatory minimum service period of twelve (12) months with the company.",
        },
        {
          type: "p",
          text: "This commitment is a material condition of employment, considering the training, onboarding effort, internal capability development, systems access, and client exposure investments made by the company. Candidates who are unable or unwilling to commit to this minimum duration should not accept this appointment.",
        },

        { type: "h", text: "6. Early Exit Contrary to Commitment" },
        {
          type: "p",
          text: "While employment may be terminated in accordance with applicable law, any resignation initiated before completion of the twelve (12) month minimum service commitment shall be treated as an early exit from a committed term and shall trigger the exit obligations outlined herein.",
        },
        {
          type: "p",
          text: "In such cases, a mandatory notice period of sixty (60) days shall apply.\nThe company may, at its sole discretion and in writing:",
        },
        {
          type: "ul",
          items: [
            "Require service of the full notice period, or",
            "Approve an early release subject to business continuity and handover readiness.",
          ],
        },
        { type: "p", text: "The employee shall not assume or insist upon a specific relieving date." },

        { type: "h", text: "7. Resignation After Completion of Twelve (12) Months" },
        {
          type: "p",
          text: "After completion of twelve (12) months of confirmed service, the employee may resign by providing sixty (60) days' written notice.",
        },
        {
          type: "p",
          text: "The company may, at its discretion, require full service of the notice period or approve an earlier release, subject to satisfactory handover.",
        },

        { type: "h", text: "8. Notice Period Salary, Retention & Full & Final Settlement" },
        {
          type: "p",
          text: "During the sixty (60) day notice period, salary shall be processed monthly as per payroll, subject to attendance, performance, and completion of assigned responsibilities.",
        },
      ],
    },

    {
      page: 3,
      title: "Retention, Cost Recovery, Relieving and Termination",
      blocks: [
        {
          type: "p",
          text: "A retention amount equivalent to 50% of one month's salary shall be withheld as a handover and continuity safeguard.",
        },
        { type: "p", text: "This retention amount shall be released only upon:" },
        {
          type: "ul",
          items: [
            "Completion of the full notice period",
            "Satisfactory handover of responsibilities",
            "Clearance of all company assets, access, and obligations",
          ],
        },
        {
          type: "p",
          text: "The retention amount shall be released along with the Full & Final Settlement, which shall be processed within ten (10) working days from the effective relieving date or the subsequent payroll cycle, whichever is earlier.",
        },

        { type: "h", text: "9. Training & Onboarding Cost Recovery (Early Exit)" },
        {
          type: "p",
          text: "In the event the employee resigns after confirmation but before completion of the mandatory twelve (12) month service commitment, the employee acknowledges that the company has incurred substantial costs towards training, onboarding, internal capability development, systems access, and client transition.",
        },
        {
          type: "p",
          text: "Accordingly, the employee agrees to reimburse the company a fixed amount of ₹75,000 (Rupees Seventy-Five Thousand only) as training and onboarding cost recovery. This amount represents a reasonable and mutually agreed pre-estimate of such investment.",
        },
        {
          type: "p",
          text: "This recovery shall apply only where the resignation is initiated by the employee and shall not apply in cases where employment is terminated by the company.",
        },
        {
          type: "p",
          text: "Any early release prior to completion of the notice period shall be solely at the discretion of management and subject to settlement of applicable recovery amounts and completion of handover obligations.",
        },

        { type: "h", text: "10. Relieving & Experience Letter" },
        {
          type: "p",
          text: "Relieving and experience letters shall be issued subject to completion of notice obligations, satisfactory handover, and clearance of all company assets, in accordance with internal policy and applicable law.",
        },

        { type: "h", text: "11. Termination by Management" },
        {
          type: "p",
          text: "Post-joining, the company may terminate employment by providing seven (7) days' written notice or salary in lieu thereof, in cases including but not limited to performance issues, skill mismatch, conduct concerns, or business requirements.",
        },
      ],
    },

    {
      page: 4,
      title: "Absconding, Confidentiality and Governing Law",
      blocks: [
        {
          type: "p",
          text: "This provision exists to ensure operational continuity and avoid prolonged disengagement.",
        },

        { type: "h", text: "12. Absconding / Abandonment of Employment" },
        {
          type: "p",
          text: "Absence without approval or failure to report to work for two (2) consecutive working days, without written communication, shall trigger formal notice.",
        },
        {
          type: "p",
          text: "If no response or justification is received, employment shall be treated as abandoned, and settlement shall be processed strictly on days actually worked, with recovery of applicable notice period shortfall and dues, if any.",
        },

        { type: "h", text: "13. Confidentiality & Non-Disclosure" },
        {
          type: "p",
          text: "During the course of employment and thereafter, you shall not disclose any confidential, proprietary, or client-related information of the company, its clients, or associates to any third party without prior written consent.",
        },

        { type: "h", text: "14. Governing Law" },
        {
          type: "p",
          text: "This appointment letter shall be governed by and construed in accordance with the laws of India, and courts in India shall have exclusive jurisdiction.",
        },

        {
          type: "p",
          text: "If the above terms and conditions are acceptable, please sign and return a copy of this letter as a token of your acceptance.",
        },
        { type: "p", text: `Yours sincerely,\nFor ${COMPANY.name}` },
        {
          type: "p",
          text: `Authorized Signatory\nName: ${COMPANY.signatoryName}\nDesignation: ${COMPANY.signatoryTitle}\nDate: ${formatDate(input.issuedOn)}`,
        },

        { type: "h", text: "Employee Acceptance" },
        {
          type: "p",
          text: "I have read, understood, and accepted the terms and conditions of this appointment letter.",
        },
      ],
    },

    {
      page: 5,
      title: "Employee Acceptance",
      blocks: [
        {
          type: "p",
          text: `Employee Name: ${input.fullName}\nSignature: affixed digitally below\nDate: recorded when this page is signed`,
        },
        { type: "logo" },
      ],
    },
  ];
}

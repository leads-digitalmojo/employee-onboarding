/**
 * Roles an employee can be appointed to. The employee picks one at first login,
 * and it fills the "Role Name" placeholder in the appointment letter. Everything
 * else about the appointment comes from the HR-provisioned record.
 */
export type Role = {
  key: string;
  designation: string;
  department: string;
};

export const ROLES: Role[] = [
  {
    key: "video_editor",
    designation: "Video Editor",
    department: "Creative",
  },
  {
    key: "junior_video_editor",
    designation: "Junior Video Editor",
    department: "Creative",
  },
  {
    key: "full_stack_seo",
    designation: "Full Stack SEO",
    department: "SEO",
  },
  {
    key: "performance_marketing_specialist",
    designation: "Performance Marketing Specialist",
    department: "Performance Marketing",
  },
  {
    key: "performance_marketing_lead",
    designation: "Performance Marketing Lead",
    department: "Performance Marketing",
  },
  {
    key: "graphic_designer",
    designation: "Graphic Designer",
    department: "Creative",
  },
  {
    key: "social_media_manager",
    designation: "Social Media Manager",
    department: "Social Media",
  },
  {
    key: "hr_executive",
    designation: "HR Executive",
    department: "People Operations",
  },
  {
    key: "hr_manager",
    designation: "HR Manager",
    department: "People Operations",
  },
  {
    key: "operations_executive",
    designation: "Operations Executive",
    department: "Operations",
  },
  {
    key: "local_seo",
    designation: "Local SEO",
    department: "SEO",
  },
  {
    key: "web_developer",
    designation: "Web Developer",
    department: "Engineering",
  },
];

export function findRole(key: string): Role | undefined {
  return ROLES.find((r) => r.key === key);
}

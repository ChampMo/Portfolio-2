// ไฟล์: src/lib/mock/experience.ts

export type ExperienceEntry = {
  id: string;
  role: string;
  organization: string;
  type: "INTERNSHIP" | "PROJECT" | "ACADEMIC" | "FREELANCE";
  time: string;
  location: string;
  summary: string;
  achievements: string[];
  stack?: string[];
};

export const experienceData = {
  title: "[ MISSION LOG ]",
  description: "Past trajectories and the experience gained along the way.",
  entries: [
    {
      id: "internship-2025",
      role: "Full-Stack Developer Intern",
      organization: "TBD Tech Studio",
      type: "INTERNSHIP",
      time: "2025",
      location: "Bangkok, Thailand",
      summary:
        "Joined a small product team to ship customer-facing features across the stack.",
      achievements: [
        "Delivered 3 production features end-to-end during the internship.",
        "Improved page load by 30% through targeted query and bundle audits.",
        "Wrote internal docs that onboarded the next intern in under a week.",
      ],
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Docker"],
    },
    {
      id: "kmutt-capstone",
      role: "Lead Developer — Senior Project",
      organization: "KMUTT, Applied Computer Science",
      type: "ACADEMIC",
      time: "2024 - 2025",
      location: "KMUTT Campus",
      summary:
        "Led a 4-person team building a data-driven web platform as our final-year capstone.",
      achievements: [
        "Owned system architecture and code review standards.",
        "Designed the database schema and API contracts for the team.",
        "Presented the project to faculty and industry reviewers.",
      ],
      stack: ["React", "Node.js", "MySQL"],
    },
    {
      id: "qa-coursework",
      role: "QA Automation — Coursework",
      organization: "KMUTT, Software Testing",
      type: "ACADEMIC",
      time: "2024",
      location: "KMUTT Campus",
      summary:
        "Authored automated test suites for a class-wide web application project.",
      achievements: [
        "Built a Robot Framework suite covering core user journeys.",
        "Integrated Selenium scripts into a basic CI workflow.",
      ],
      stack: ["Robot Framework", "Selenium", "Python"],
    },
    {
      id: "freelance",
      role: "Freelance Web Developer",
      organization: "Independent",
      type: "FREELANCE",
      time: "2023 - Present",
      location: "Remote",
      summary:
        "Occasional contract work building landing pages and small dashboards for student orgs and friends' startups.",
      achievements: [
        "Shipped 5+ landing pages with custom CMS-backed content.",
        "Maintained ongoing support and analytics for active clients.",
      ],
      stack: ["Next.js", "Tailwind CSS", "MongoDB"],
    },
  ] as ExperienceEntry[],
};

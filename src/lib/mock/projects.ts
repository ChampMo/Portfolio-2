// ไฟล์: src/lib/mock/projects.ts

export type Project = {
  id: string;
  name: string;
  codename: string;
  year: string;
  role: string;
  status: "DEPLOYED" | "IN_ORBIT" | "ARCHIVED";
  summary: string;
  description: string;
  stack: string[];
  highlights: string[];
  links?: {
    repo?: string;
    live?: string;
  };
};

export const projectsData = {
  title: "[ MISSION ARCHIVES ]",
  description: "Selected expeditions across the development cosmos.",
  projects: [
    {
      id: "agenda",
      name: "Agenda",
      codename: "PROJECT_AGENDA",
      year: "2024",
      role: "Full-Stack Developer",
      status: "DEPLOYED",
      summary: "A modern task & schedule management platform with real-time sync.",
      description:
        "Agenda is a productivity hub that unifies daily tasks, calendar events, and collaborative notes into a single fluid interface. Built around a real-time data layer so teams can plan together without refresh friction.",
      stack: ["Next.js", "TypeScript", "Tailwind CSS", "PostgreSQL", "Prisma"],
      highlights: [
        "Designed and shipped the entire schema + REST layer.",
        "Implemented optimistic UI updates for sub-100ms perceived latency.",
        "Built a drag-and-drop weekly planner with keyboard accessibility.",
      ],
      links: { repo: "https://github.com", live: "#" },
    },
    {
      id: "resumehub",
      name: "ResumeHub",
      codename: "PROJECT_RESUMEHUB",
      year: "2024",
      role: "Full-Stack Developer",
      status: "IN_ORBIT",
      summary: "An AI-assisted resume builder with live templates and export.",
      description:
        "ResumeHub helps job-seekers generate ATS-ready resumes from structured profile data. Templates are rendered server-side for pixel-accurate PDF exports, with an LLM layer that rewrites bullet points based on a target role.",
      stack: ["Next.js", "Node.js", "Tailwind CSS", "MongoDB", "OpenAI API"],
      highlights: [
        "Server-rendered PDF pipeline keeping fonts & layout consistent.",
        "Prompt engineering for role-aware bullet point rewriting.",
        "Sharable resume URLs with privacy-aware access tokens.",
      ],
      links: { repo: "https://github.com" },
    },
    {
      id: "tech-balance",
      name: "Tech Balance",
      codename: "PROJECT_TECH_BALANCE",
      year: "2023",
      role: "Frontend Developer",
      status: "ARCHIVED",
      summary: "A dashboard surfacing personal screen-time & focus analytics.",
      description:
        "Tech Balance ingests device usage data and visualises focus vs distraction patterns. The goal: nudge healthier digital habits with friendly weekly reports rather than guilt-driven alerts.",
      stack: ["React", "TypeScript", "Recharts", "Node.js", "MySQL"],
      highlights: [
        "Built composable chart primitives on top of Recharts.",
        "Authored the weekly digest engine summarising usage trends.",
        "Reduced first-paint by 40% through route-level code splitting.",
      ],
      links: { repo: "https://github.com" },
    },{
      id: "tech-balance1",
      name: "Tech Balance",
      codename: "PROJECT_TECH_BALANCE",
      year: "2023",
      role: "Frontend Developer",
      status: "ARCHIVED",
      summary: "A dashboard surfacing personal screen-time & focus analytics.",
      description:
        "Tech Balance ingests device usage data and visualises focus vs distraction patterns. The goal: nudge healthier digital habits with friendly weekly reports rather than guilt-driven alerts.",
      stack: ["React", "TypeScript", "Recharts", "Node.js", "MySQL"],
      highlights: [
        "Built composable chart primitives on top of Recharts.",
        "Authored the weekly digest engine summarising usage trends.",
        "Reduced first-paint by 40% through route-level code splitting.",
      ],
      links: { repo: "https://github.com" },
    },{
      id: "tech-balance2",
      name: "Tech Balance",
      codename: "PROJECT_TECH_BALANCE",
      year: "2023",
      role: "Frontend Developer",
      status: "ARCHIVED",
      summary: "A dashboard surfacing personal screen-time & focus analytics.",
      description:
        "Tech Balance ingests device usage data and visualises focus vs distraction patterns. The goal: nudge healthier digital habits with friendly weekly reports rather than guilt-driven alerts.",
      stack: ["React", "TypeScript", "Recharts", "Node.js", "MySQL"],
      highlights: [
        "Built composable chart primitives on top of Recharts.",
        "Authored the weekly digest engine summarising usage trends.",
        "Reduced first-paint by 40% through route-level code splitting.",
      ],
      links: { repo: "https://github.com" },
    },{
      id: "tech-balance3",
      name: "Tech Balance",
      codename: "PROJECT_TECH_BALANCE",
      year: "2023",
      role: "Frontend Developer",
      status: "ARCHIVED",
      summary: "A dashboard surfacing personal screen-time & focus analytics.",
      description:
        "Tech Balance ingests device usage data and visualises focus vs distraction patterns. The goal: nudge healthier digital habits with friendly weekly reports rather than guilt-driven alerts.",
      stack: ["React", "TypeScript", "Recharts", "Node.js", "MySQL"],
      highlights: [
        "Built composable chart primitives on top of Recharts.",
        "Authored the weekly digest engine summarising usage trends.",
        "Reduced first-paint by 40% through route-level code splitting.",
      ],
      links: { repo: "https://github.com" },
    },
  ] as Project[],
};

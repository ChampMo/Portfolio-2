// ไฟล์: src/lib/mock/services.ts

export type Service = {
  id: string;
  icon: string; // iconify name
  name: string;
  tagline: string;
  description: string;
  deliverables: string[];
};

export const servicesData = {
  title: "[ SERVICE BAY ]",
  description: "Capabilities deployable on demand across the mission.",
  services: [
    {
      id: "web-app",
      icon: "mdi:web",
      name: "Web Application Development",
      tagline: "Full-stack apps that ship and scale.",
      description:
        "End-to-end product delivery: from data modelling and API design to a polished, responsive interface. Comfortable owning a feature from blank file to production deployment.",
      deliverables: [
        "Next.js / React frontends with TypeScript",
        "REST & server actions backed by relational or document databases",
        "Authentication, role-based access, and audit logging",
      ],
    },
    {
      id: "ui-engineering",
      icon: "mdi:palette-swatch-outline",
      name: "UI Engineering & Interactive 3D",
      tagline: "Interfaces that feel alive.",
      description:
        "Design-conscious frontend work with a focus on motion, micro-interactions, and immersive 3D layers using Three.js / React Three Fiber.",
      deliverables: [
        "Component systems with Tailwind CSS",
        "GSAP & Framer Motion animation choreography",
        "WebGL scenes integrated cleanly with React state",
      ],
    },
    {
      id: "automation",
      icon: "mdi:robot-outline",
      name: "QA Automation & Tooling",
      tagline: "Confidence shipped alongside code.",
      description:
        "Build automated test suites and internal tooling that keep release cadence high without sacrificing reliability.",
      deliverables: [
        "End-to-end suites with Selenium / Robot Framework",
        "CI pipelines reporting test health on every push",
        "Internal dashboards for QA visibility",
      ],
    },
    {
      id: "consulting",
      icon: "mdi:compass-outline",
      name: "Technical Consulting",
      tagline: "A second pair of eyes for early-stage builds.",
      description:
        "Architecture reviews, stack selection, and pragmatic guidance for student teams and early product squads.",
      deliverables: [
        "Stack & hosting recommendations",
        "Codebase walkthroughs with prioritised improvements",
        "Mentorship sessions on modern web tooling",
      ],
    },
    {
      id: "consulting1",
      icon: "mdi:compass-outline",
      name: "Technical Consulting",
      tagline: "A second pair of eyes for early-stage builds.",
      description:
        "Architecture reviews, stack selection, and pragmatic guidance for student teams and early product squads.",
      deliverables: [
        "Stack & hosting recommendations",
        "Codebase walkthroughs with prioritised improvements",
        "Mentorship sessions on modern web tooling",
      ],
    },
  ] as Service[],
};

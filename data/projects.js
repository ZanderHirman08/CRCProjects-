/*
 * ─────────────────────────────────────────────────────────────
 *  SITE SETTINGS + PROJECT LIST
 *  This is the only file you need to edit to update the site.
 * ─────────────────────────────────────────────────────────────
 */

window.SITE = {
  // Shown in the header and browser tab
  title: "CRC Projects",
  owner: "Zander Hirman",

  // One or two sentences shown at the top of the home page
  intro:
    "A collection of the projects I've built and contributed to at CRC — " +
    "what each one is, what I did, and what I learned.",

  // Link back to your main portfolio (shown in the header + footer)
  portfolioUrl: "https://zanderhirman08.github.io/",

  // Optional extra links in the footer. Delete any you don't want.
  links: [
    { label: "GitHub", url: "https://github.com/zanderhirman08" }
    // { label: "LinkedIn", url: "https://www.linkedin.com/in/your-handle" },
    // { label: "Email", url: "mailto:you@example.com" }
  ]
};

/*
 * Each project is one object in this list. Copy the example below,
 * paste it as a new entry, and fill it in.
 *
 *   id          short unique name used in the URL (lowercase, dashes, no spaces)
 *   title       project name
 *   date        "YYYY-MM" — projects are sorted newest first
 *   summary     one or two sentences shown on the card
 *   role        what you did (optional)
 *   tags        list of skills/tools — these become the filter buttons
 *   image       path to an image in assets/images/projects/ (optional)
 *   links       buttons on the project page, e.g. code, demo, slides (optional)
 *   details     longer write-up shown on the project page. Each string is a
 *               paragraph. Lines starting with "- " become a bullet list. (optional)
 *   featured    true to pin the project to the top (optional)
 */

window.PROJECTS = [
  {
    id: "example-project",
    title: "Example Project (replace me)",
    date: "2026-09",
    summary:
      "This is a placeholder showing how a project entry looks. Edit or delete it in data/projects.js.",
    role: "Lead developer",
    tags: ["Example", "Template"],
    image: "",
    links: [
      { label: "Source code", url: "https://github.com/zanderhirman08/CRCProjects-" }
    ],
    details: [
      "Use this section to describe the problem the project solved and why it mattered.",
      "What I did:",
      "- Built the first thing\n- Designed the second thing\n- Tested and shipped it",
      "Close with the outcome — results, numbers, or what you'd do differently next time."
    ],
    featured: true
  }
];

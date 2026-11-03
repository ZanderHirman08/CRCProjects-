/*
 * ─────────────────────────────────────────────────────────────
 *  SITE SETTINGS + PROJECT LIST
 *  This is the only file you need to edit to update the site.
 * ─────────────────────────────────────────────────────────────
 */

window.SITE = {
  // Header brand + browser tab title
  title: "CRC Projects",
  owner: "Zander Hirman",

  // Small line above the big heading
  eyebrow: "GIS · Coastal Regional Commission",

  // Big heading on the home page
  heading: "Coastal Regional Commission Projects",

  // Intro paragraph under the heading
  intro:
    "GIS and mapping work from my time with the Coastal Regional Commission (CRC). " +
    "Each project covers what the problem was, what I built, and how it was used.",

  // "About" section. Each string is a paragraph. Delete the lines to hide the section.
  about: [
    "Describe your role at the CRC here: your title, the dates, and which team or department you worked with.",
    "Then a sentence or two on the kind of work you did there and the tools you used most."
  ],

  // Link back to your main portfolio
  portfolioUrl: "https://zanderhirman08.github.io/",

  // Contact links at the bottom of the page
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/zander-hirman-918364390/" },
    { label: "GitHub", url: "https://github.com/ZanderHirman08" }
  ],

  // Starting view of the map at the top of the home page.
  // Projects with a `location` show up as points on it.
  map: { center: [31.6, -81.4], zoom: 8 }
};

/*
 * Each project is one object in this list. They appear on the site in
 * the same order as here. Copy the example below and fill it in.
 *
 *   id        short unique name used in the URL (lowercase, dashes, no spaces)
 *   title     project name
 *   date      shown as written, e.g. "Summer 2026"
 *   badge     small label above the title, e.g. "Case Study" (optional)
 *   role      what you did (optional)
 *   tags      tools/skills — these also become the filter buttons
 *   summary   2–3 sentences shown on the card
 *   image     thumbnail, e.g. "assets/images/projects/my-map.png" (optional)
 *   location  { name, lat, lng } puts a point on the map (optional)
 *   links     buttons, e.g. live map, StoryMap, write-up PDF (optional)
 *   figures   [{ src, caption }] images shown in a strip on the project page (optional)
 *   details   longer write-up on the project page. Each string is a paragraph;
 *             lines starting with "- " become a bullet list. (optional)
 */

window.PROJECTS = [
  {
    id: "altamaha-little-amazon",
    title: "The Little Amazon: Altamaha River Delta in Near-Infrared",
    date: "Fall 2026",
    badge: "GIS Day 2026",
    role: "Cartography, remote sensing, lidar analysis",
    tags: ["ArcGIS Pro", "Remote Sensing", "Lidar", "Cartography", "Web Map"],
    summary:
      "A print and web map of the Altamaha River delta. Color-infrared satellite imagery makes " +
      "healthy swamp and marsh glow red, and lidar terrain shading shows the floodplain hidden under the canopy.",
    image: "",
    location: { name: "Altamaha River Delta, GA", lat: 31.355, lng: -81.43 },
    links: [
      { label: "Open the interactive map", url: "altamaha.html" },
      { label: "How it was made", url: "https://github.com/ZanderHirman08/CRCProjects-/blob/main/gis-day/altamaha/GUIDE.md" }
    ],
    figures: [],
    details: [
      "The Altamaha drains about a quarter of Georgia and has no dams on its main stem. Near Darien it " +
        "spreads into one of the largest undeveloped river deltas on the Atlantic coast, often called " +
        "Georgia's Little Amazon. I made this map for GIS Day to show that landscape in a way people rarely see it.",
      "What I did:",
      "- Built a color-infrared composite (NIR, Red, Green) from Sentinel-2 imagery, where healthy vegetation shows as red\n" +
        "- Processed lidar bare-earth elevation into a multidirectional hillshade and blended it with the imagery\n" +
        "- Made a relative elevation model (height above the river) to reveal old channels, levees and rice-field dikes\n" +
        "- Designed a 36 × 24 in print layout in ArcGIS Pro and an interactive swipe map for the web",
      "Data: Copernicus Sentinel-2 (ESA), USGS 3DEP and NOAA coastal lidar, USGS National Hydrography Dataset."
    ]
  },
  {
    id: "example-project",
    title: "Example Project (replace me)",
    date: "Fall 2026",
    badge: "Example",
    role: "GIS Intern",
    tags: ["ArcGIS Pro", "Example"],
    summary:
      "This is a placeholder showing how a project entry looks. Edit or delete it in data/projects.js.",
    image: "",
    location: { name: "Brunswick, GA", lat: 31.15, lng: -81.49 },
    links: [
      { label: "Source", url: "https://github.com/ZanderHirman08/CRCProjects-" }
    ],
    figures: [],
    details: [
      "Use this section to describe the problem the project solved and who it was for.",
      "What I did:",
      "- Collected or compiled the data\n- Built the analysis or map\n- Delivered it to staff, partners, or the public",
      "Close with the outcome: how it was used, results, or what you'd do differently."
    ]
  }
];

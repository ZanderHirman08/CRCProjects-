// Renders the site from window.SITE and window.PROJECTS (see data/projects.js).

const SITE = window.SITE || {};
const PROJECTS = window.PROJECTS || [];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function projectHref(p) {
  return `project.html?id=${encodeURIComponent(p.id)}`;
}

function tagList(tags) {
  return (tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
}

function paragraphs(blocks) {
  return (blocks || []).map((block) => {
    const lines = String(block).split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return `<ul>${lines.map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join("")}</ul>`;
    }
    return `<p>${esc(block)}</p>`;
  }).join("");
}

// Same basemap and marker style as the main portfolio
function makeMap(el, view) {
  if (!window.L) return null;
  el.hidden = false;
  const map = L.map(el, { scrollWheelZoom: false }).setView(view.center, view.zoom);
  // OpenStreetMap tiles: free, no API key needed
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);
  return map;
}

function addMarker(map, p, withLink) {
  const loc = p.location;
  const popup = `<strong>${esc(loc.name || p.title)}</strong><br>${esc(p.title)}` +
    (withLink ? `<br><a href="${projectHref(p)}">View project</a>` : "");
  return L.circleMarker([loc.lat, loc.lng], {
    radius: 7, color: "#2f5d6b", weight: 2, fillColor: "#2f5d6b", fillOpacity: 0.6
  }).addTo(map).bindPopup(popup);
}

function renderChrome() {
  document.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    if (key === "portfolio") {
      if (SITE.portfolioUrl) el.href = SITE.portfolioUrl;
      else el.hidden = true;
    } else if (SITE[key]) {
      el.textContent = SITE[key];
    }
  });

  const footer = document.getElementById("footer");
  if (footer) footer.innerHTML = `&copy; ${new Date().getFullYear()} ${esc(SITE.owner)}`;

  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", nav.classList.toggle("open"));
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", false);
    }));
  }
}

function card(p) {
  const thumb = p.image
    ? `<div class="thumb"><img src="${esc(p.image)}" alt="" loading="lazy" /></div>`
    : `<div class="thumb no-image">${esc((p.tags || [])[0] || p.title)}</div>`;
  return `
    <a class="project-card" href="${projectHref(p)}">
      ${thumb}
      <div class="body">
        ${p.badge ? `<span class="featured-badge">${esc(p.badge)}</span>` : ""}
        <h3>${esc(p.title)}</h3>
        <div class="date">${esc(p.date)}</div>
        <div class="tags">${tagList(p.tags)}</div>
        <p class="desc">${esc(p.summary)}</p>
        <span class="more">Read more &rarr;</span>
      </div>
    </a>`;
}

function renderHome() {
  renderChrome();
  document.title = `${SITE.title || "CRC Projects"} | ${SITE.owner || ""}`;

  // About
  if ((SITE.about || []).length) {
    document.getElementById("about").hidden = false;
    document.getElementById("aboutBody").innerHTML = paragraphs(SITE.about);
  } else {
    document.getElementById("navAbout").hidden = true;
  }

  // Contact
  const contacts = [];
  if (SITE.portfolioUrl) contacts.push({ label: "Main Portfolio", url: SITE.portfolioUrl });
  contacts.push(...(SITE.links || []));
  document.getElementById("contactList").innerHTML = contacts
    .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
    .join("");

  // Map of project locations
  const located = PROJECTS.filter((p) => p.location);
  if (located.length && SITE.map) {
    const map = makeMap(document.getElementById("hero-map"), SITE.map);
    if (map) located.forEach((p) => addMarker(map, p, true));
  }

  // Projects + tag filters
  const grid = document.getElementById("projectGrid");
  const filters = document.getElementById("filters");
  const empty = document.getElementById("empty");
  const allTags = [...new Set(PROJECTS.flatMap((p) => p.tags || []))].sort();
  let active = "All";

  function draw() {
    const shown = active === "All" ? PROJECTS : PROJECTS.filter((p) => (p.tags || []).includes(active));
    grid.innerHTML = shown.map(card).join("");
    empty.hidden = shown.length > 0;
    filters.querySelectorAll("button").forEach((b) => {
      b.setAttribute("aria-pressed", String(b.dataset.tag === active));
    });
  }

  if (allTags.length > 1) {
    filters.innerHTML = ["All", ...allTags]
      .map((t) => `<button type="button" class="chip" data-tag="${esc(t)}">${esc(t)}</button>`)
      .join("");
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      active = btn.dataset.tag;
      draw();
    });
  }
  draw();
}

function renderProject() {
  renderChrome();
  const el = document.getElementById("project");
  const id = new URLSearchParams(location.search).get("id");
  const p = PROJECTS.find((x) => x.id === id);

  if (!p) {
    el.innerHTML = `<h1>Project not found</h1><p>That project doesn't exist. <a href="./#projects">See all projects</a>.</p>`;
    return;
  }

  document.title = `${p.title} | ${SITE.title || "CRC Projects"}`;
  const meta = [p.date, p.role].filter(Boolean).map(esc).join(" &middot; ");
  const links = (p.links || [])
    .map((l, i) => `<a class="btn${i ? " btn-outline" : ""}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
    .join("");
  const figures = (p.figures || []).map((f, i) => `
    <figure>
      <a href="${esc(f.src)}" target="_blank" rel="noopener"><img src="${esc(f.src)}" alt="${esc(f.caption || "")}" loading="lazy" /></a>
      ${f.caption ? `<figcaption>Fig. ${i + 1} &mdash; ${esc(f.caption)}</figcaption>` : ""}
    </figure>`).join("");

  el.innerHTML = `
    <header class="project-header">
      ${p.badge ? `<span class="featured-badge">${esc(p.badge)}</span>` : ""}
      <div class="eyebrow">${meta}</div>
      <h1>${esc(p.title)}</h1>
      <p class="subtitle">${esc(p.summary)}</p>
      <div class="tags">${tagList(p.tags)}</div>
      ${links ? `<div class="hero-actions">${links}</div>` : ""}
    </header>
    ${p.image ? `<img class="project-img" src="${esc(p.image)}" alt="${esc(p.title)}" />` : ""}
    <div class="prose">${paragraphs(p.details)}</div>
    ${figures ? `<div class="figure-strip">${figures}</div>` : ""}
    ${p.location ? `<div class="project-map" id="projectMap"></div>` : ""}`;

  if (p.location) {
    const map = makeMap(document.getElementById("projectMap"), { center: [p.location.lat, p.location.lng], zoom: 10 });
    if (map) addMarker(map, p, false);
  }
}

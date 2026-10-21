// Renders the site from window.SITE and window.PROJECTS (see data/projects.js).

const SITE = window.SITE || {};
const PROJECTS = (window.PROJECTS || []).slice().sort((a, b) => {
  if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
  return (b.date || "").localeCompare(a.date || "");
});

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function formatDate(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  if (!m) return String(y);
  return new Date(y, m - 1).toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

function tagList(tags) {
  return (tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("");
}

function renderChrome() {
  document.querySelectorAll('[data-site="title"]').forEach((el) => {
    if (SITE.title) el.textContent = SITE.title;
  });
  document.querySelectorAll('[data-site="owner"]').forEach((el) => {
    el.textContent = SITE.owner || "";
  });
  document.querySelectorAll('[data-site="intro"]').forEach((el) => {
    el.textContent = SITE.intro || "";
  });
  document.querySelectorAll('[data-site="portfolio"]').forEach((el) => {
    if (SITE.portfolioUrl) el.href = SITE.portfolioUrl;
    else el.hidden = true;
  });

  const footer = document.getElementById("footer");
  if (footer) {
    const links = [];
    if (SITE.portfolioUrl) links.push({ label: "Portfolio", url: SITE.portfolioUrl });
    links.push(...(SITE.links || []));
    footer.innerHTML = `
      <span>© ${new Date().getFullYear()} ${esc(SITE.owner)}</span>
      <nav>${links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join("")}</nav>`;
  }
}

function card(p) {
  const href = `project.html?id=${encodeURIComponent(p.id)}`;
  const img = p.image
    ? `<img class="card-img" src="${esc(p.image)}" alt="" loading="lazy">`
    : `<div class="card-img card-img-placeholder" aria-hidden="true">${esc((p.title || "?")[0])}</div>`;
  return `
    <a class="card" href="${href}">
      ${img}
      <div class="card-body">
        <div class="card-meta">${esc(formatDate(p.date))}${p.featured ? ' · <span class="star">Featured</span>' : ""}</div>
        <h2 class="card-title">${esc(p.title)}</h2>
        <p class="card-summary">${esc(p.summary)}</p>
        <div class="tags">${tagList(p.tags)}</div>
      </div>
    </a>`;
}

function renderHome() {
  renderChrome();
  const grid = document.getElementById("project-grid");
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

function renderDetails(details) {
  return (details || []).map((block) => {
    const lines = String(block).split("\n");
    if (lines.every((l) => l.trim().startsWith("- "))) {
      return `<ul>${lines.map((l) => `<li>${esc(l.trim().slice(2))}</li>`).join("")}</ul>`;
    }
    return `<p>${esc(block)}</p>`;
  }).join("");
}

function renderProject() {
  renderChrome();
  const el = document.getElementById("project");
  const id = new URLSearchParams(location.search).get("id");
  const p = PROJECTS.find((x) => x.id === id);

  if (!p) {
    el.innerHTML = `<h1>Project not found</h1><p>That project doesn't exist. <a href="./">See all projects</a>.</p>`;
    return;
  }

  document.title = `${p.title} — ${SITE.title || "CRC Projects"}`;
  const links = (p.links || [])
    .map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`)
    .join("");

  el.innerHTML = `
    <header class="project-header">
      <div class="card-meta">${esc(formatDate(p.date))}${p.role ? ` · ${esc(p.role)}` : ""}</div>
      <h1>${esc(p.title)}</h1>
      <p class="lead">${esc(p.summary)}</p>
      <div class="tags">${tagList(p.tags)}</div>
      ${links ? `<div class="actions">${links}</div>` : ""}
    </header>
    ${p.image ? `<img class="project-img" src="${esc(p.image)}" alt="${esc(p.title)}">` : ""}
    <div class="prose">${renderDetails(p.details)}</div>`;
}

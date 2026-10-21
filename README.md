# CRC Projects

A standalone site showcasing the projects I've worked on at CRC. It's meant to be linked from my main portfolio.

**Live site:** https://zanderhirman08.github.io/CRCProjects-/

The site is plain HTML, CSS and JavaScript, with no build step or dependencies. GitHub Pages serves it straight from the repo.

## Adding or editing a project

Everything lives in **`data/projects.js`**:

1. Copy an existing entry in the `window.PROJECTS` list and paste it as a new item.
2. Give it a unique `id` (lowercase, dashes, e.g. `robot-arm-controller`). This becomes its URL: `project.html?id=robot-arm-controller`.
3. Fill in `title`, `date` (`YYYY-MM`), `summary`, `tags`, and optionally `role`, `links`, `details`, `image`, `featured`.
4. For an image, drop the file in `assets/images/projects/` and set `image: "assets/images/projects/your-file.jpg"`.
5. Commit and push. The site updates in about a minute.

Site-wide settings (title, intro text, portfolio link, footer links) are in the `window.SITE` object at the top of the same file.

## Structure

```
index.html              Home page: project grid with tag filters
project.html            Project detail page (reads ?id= from the URL)
data/projects.js        Site settings and project list (edit this)
assets/css/style.css    Styles (light and dark mode)
assets/js/main.js       Renders pages from the data
assets/images/projects/ Project screenshots and images
```

## Previewing locally

Open `index.html` in a browser, or run a local server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Publishing with GitHub Pages (one-time setup)

1. Merge this work into the `main` branch.
2. On GitHub, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose **`main`** and **`/ (root)`**, then click **Save**.
4. After a minute the site is live at `https://zanderhirman08.github.io/CRCProjects-/`.

Then add that URL to your portfolio site.

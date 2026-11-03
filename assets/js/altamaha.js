// "The Little Amazon": Altamaha River delta web map (altamaha.html)
//
// Left of the swipe handle: false-color infrared (NIR-Red-Green) satellite imagery.
// Right of the handle: ordinary true-color imagery.
// Over both: lidar-derived hillshade, blended with "multiply" (see altamaha.css).

const CONFIG = {
  center: [31.355, -81.43],
  zoom: 12,
  minZoom: 9,
  maxZoom: 17,

  // After you publish your own map from ArcGIS Pro as a hosted tile layer,
  // paste its tile URL here and the page uses it for the infrared side
  // instead of the live Esri imagery services, e.g.
  //   "https://tiles.arcgis.com/tiles/<ORG_ID>/arcgis/rest/services/Altamaha_CIR/MapServer/tile/{z}/{y}/{x}"
  // If your published layer already has the hillshade blended in, set bakedTerrain to true.
  customCirTiles: "",
  bakedTerrain: false,

  // Live Esri image services that render the color-infrared band combination on the fly.
  sources: {
    sentinel: {
      url: "https://sentinel.arcgis.com/arcgis/rest/services/Sentinel2/ImageServer",
      rule: "Color Infrared with DRA",
      attribution: "Copernicus Sentinel-2 (ESA) via Esri"
    },
    landsat: {
      url: "https://landsat2.arcgis.com/arcgis/rest/services/Landsat/MS/ImageServer",
      rule: "Color Infrared with DRA",
      attribution: "Landsat (USGS/NASA) via Esri"
    }
  }
};

// Short notes for the GIS Day audience. Locations are approximate label points.
const PLACES = [
  {
    name: "Darien",
    lat: 31.370, lng: -81.434,
    note: "Founded in 1736 on the bluff above the river. Its rice and timber trade depended entirely on the delta."
  },
  {
    name: "Butler Island",
    lat: 31.352, lng: -81.418,
    note: "Former tidal rice plantation. The straight lines you can still see are old dikes and canals, kept today for waterfowl."
  },
  {
    name: "Lewis Island",
    lat: 31.410, lng: -81.545,
    note: "Home to one of the oldest stands of bald cypress in the Southeast. Some trees are believed to be over 1,000 years old."
  },
  {
    name: "Altamaha Sound",
    lat: 31.315, lng: -81.290,
    note: "Where the river meets the Atlantic. Fresh water, salt water and sediment mix here, feeding the marshes on either side."
  },
  {
    name: "Wolf Island",
    lat: 31.335, lng: -81.320,
    note: "A national wildlife refuge of salt marsh and beach, managed as a protected wilderness."
  },
  {
    name: "Sapelo Island",
    lat: 31.420, lng: -81.255,
    note: "Barrier island and home of the Sapelo Island National Estuarine Research Reserve."
  }
];

// ── A minimal ArcGIS ImageServer layer: one exportImage request per view ──
const ImageServerLayer = L.Layer.extend({
  options: { pane: "overlayPane", opacity: 1, attribution: "" },

  initialize(url, rule, options) {
    this._url = url;
    this._rule = rule;
    L.setOptions(this, options);
  },

  getAttribution() { return this.options.attribution; },

  onAdd(map) {
    this._map = map;
    map.on("moveend", this._update, this);
    this._update();
  },

  onRemove(map) {
    map.off("moveend", this._update, this);
    if (this._overlay) map.removeLayer(this._overlay);
    if (this._pending) map.removeLayer(this._pending);
    this._overlay = this._pending = null;
  },

  _update() {
    const map = this._map;
    if (!map) return;
    const bounds = map.getBounds();
    const crs = map.options.crs;
    const sw = crs.project(bounds.getSouthWest());
    const ne = crs.project(bounds.getNorthEast());
    const size = map.getSize();
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(Math.round(size.x * scale), 4000);
    const h = Math.min(Math.round(size.y * scale), 4000);

    const params = new URLSearchParams({
      bbox: [sw.x, sw.y, ne.x, ne.y].join(","),
      bboxSR: "3857",
      imageSR: "3857",
      size: `${w},${h}`,
      format: "jpgpng",
      f: "image",
      renderingRule: JSON.stringify({ rasterFunction: this._rule })
    });
    const src = `${this._url}/exportImage?${params}`;

    if (this._pending) map.removeLayer(this._pending);
    const next = L.imageOverlay(src, bounds, {
      pane: this.options.pane,
      opacity: 0,
      interactive: false
    });
    this._pending = next;
    next.once("load", () => {
      if (this._pending !== next) return;
      next.setOpacity(this.options.opacity);
      if (this._overlay) map.removeLayer(this._overlay);
      this._overlay = next;
      this._pending = null;
    });
    next.once("error", () => {
      if (this._pending === next) {
        map.removeLayer(next);
        this._pending = null;
      }
      console.warn("Infrared image request failed:", this._url);
    });
    next.addTo(map);
  }
});

// ── Map setup ────────────────────────────────────────────────────
const map = L.map("map", {
  center: CONFIG.center,
  zoom: CONFIG.zoom,
  minZoom: CONFIG.minZoom,
  maxZoom: CONFIG.maxZoom,
  zoomControl: false
});
L.control.zoom({ position: "topright" }).addTo(map);

map.createPane("cir").style.zIndex = 250;
const terrainPane = map.createPane("terrain");
terrainPane.style.zIndex = 300;
terrainPane.classList.add("leaflet-terrain-pane");
terrainPane.style.pointerEvents = "none";
map.getPane("cir").style.pointerEvents = "none";

// True color (right side, also sits under everything)
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 19, maxNativeZoom: 19, attribution: "Esri, Maxar, Earthstar Geographics" }
).addTo(map);

// Lidar-derived hillshade
const terrain = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
  { pane: "terrain", maxZoom: 19, maxNativeZoom: 16, opacity: 0.55, attribution: "Esri World Hillshade (USGS 3DEP)" }
);
if (!CONFIG.bakedTerrain) terrain.addTo(map);

// Infrared (left side)
let cirLayer = null;
function setSource(key) {
  if (cirLayer) map.removeLayer(cirLayer);
  if (CONFIG.customCirTiles) {
    cirLayer = L.tileLayer(CONFIG.customCirTiles, { pane: "cir", maxZoom: 19, attribution: "Zander Hirman / CRC" });
  } else {
    const s = CONFIG.sources[key] || CONFIG.sources.sentinel;
    cirLayer = new ImageServerLayer(s.url, s.rule, { pane: "cir", attribution: s.attribution });
  }
  cirLayer.addTo(map);
}
setSource("sentinel");

// Place notes
const places = L.layerGroup(PLACES.map((p) =>
  L.circleMarker([p.lat, p.lng], {
    radius: 6, color: "#fff", weight: 2, fillColor: "#e0573e", fillOpacity: 1
  })
    .bindTooltip(p.name, { permanent: true, direction: "right", offset: [8, 0], className: "place-label" })
    .bindPopup(`<strong>${p.name}</strong>${p.note}`)
)).addTo(map);

// Start with every place note in view, clear of the info panel
const isPhone = window.matchMedia("(max-width: 640px)").matches;
map.fitBounds(L.latLngBounds(PLACES.map((p) => [p.lat, p.lng])), {
  paddingTopLeft: [isPhone ? 30 : 400, 70],
  paddingBottomRight: [isPhone ? 90 : 60, isPhone ? 150 : 50],
  maxZoom: 13
});

// ── Swipe ───────────────────────────────────────────────────────
const swipe = document.getElementById("swipe");
const handle = document.getElementById("swipeHandle");
let swipeFrac = isPhone ? 0.5 : 0.72;  // start with most of the delta in infrared

function clipCir() {
  const pane = map.getPane("cir");
  const size = map.getSize();
  const x = Math.round(size.x * swipeFrac);
  const nw = map.containerPointToLayerPoint([0, 0]);
  const se = map.containerPointToLayerPoint(size);
  pane.style.clip = `rect(${nw.y}px, ${nw.x + x}px, ${se.y}px, ${nw.x}px)`;
  swipe.style.left = `${x}px`;
}

function setSwipeFromClientX(clientX) {
  const rect = map.getContainer().getBoundingClientRect();
  swipeFrac = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  clipCir();
}

handle.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  handle.setPointerCapture(e.pointerId);
  map.dragging.disable();
  const move = (ev) => setSwipeFromClientX(ev.clientX);
  const up = () => {
    handle.removeEventListener("pointermove", move);
    handle.removeEventListener("pointerup", up);
    handle.removeEventListener("pointercancel", up);
    map.dragging.enable();
  };
  handle.addEventListener("pointermove", move);
  handle.addEventListener("pointerup", up);
  handle.addEventListener("pointercancel", up);
});

handle.addEventListener("keydown", (e) => {
  const step = e.shiftKey ? 0.1 : 0.02;
  if (e.key === "ArrowLeft") swipeFrac = Math.max(0, swipeFrac - step);
  else if (e.key === "ArrowRight") swipeFrac = Math.min(1, swipeFrac + step);
  else return;
  e.preventDefault();
  clipCir();
});

map.on("move zoom resize zoomanim", clipCir);
map.whenReady(clipCir);

// ── Panel controls ──────────────────────────────────────────────
document.getElementById("optTerrain").checked = !CONFIG.bakedTerrain;
document.getElementById("optTerrain").addEventListener("change", (e) => {
  if (e.target.checked) terrain.addTo(map);
  else map.removeLayer(terrain);
});

document.getElementById("optPlaces").addEventListener("change", (e) => {
  if (e.target.checked) places.addTo(map);
  else map.removeLayer(places);
});

const sourceSelect = document.getElementById("optSource");
if (CONFIG.customCirTiles) document.getElementById("sourceRow").hidden = true;
sourceSelect.addEventListener("change", (e) => setSource(e.target.value));

const panel = document.getElementById("panel");
const panelToggle = document.getElementById("panelToggle");
if (isPhone) {
  panel.classList.add("collapsed");
  panelToggle.setAttribute("aria-expanded", "false");
}
panelToggle.addEventListener("click", () => {
  const collapsed = panel.classList.toggle("collapsed");
  panelToggle.setAttribute("aria-expanded", String(!collapsed));
});

# The Little Amazon: Altamaha River Delta in Near-Infrared

A GIS Day 2026 map, built in ArcGIS Pro, with a print version and an online version.

**The idea:** In color-infrared imagery, healthy plants glow red. The Altamaha delta is one of the
largest undeveloped river deltas on the Atlantic coast, so most of the map lights up red. Lidar
terrain shading on top brings out the floodplain: old rice-field dikes, levees, sloughs and
cypress swamps.

**Files in this folder**

| File | What it does |
|---|---|
| `altamaha_prep.py` | arcpy script: composite, clip, DEM mosaic, multidirectional hillshade, NDVI, relative elevation model |
| `GUIDE.md` | This guide: data, processing, styling, layout, export, publishing |
| `../../altamaha.html` | The online map (swipe between infrared and true color, with lidar shading) |

---

## Schedule (GIS Day is Wednesday, Nov 18)

| When | Task |
|---|---|
| Nov 3–5 | Download imagery and lidar (the NOAA lidar order can take a few hours to be emailed) |
| Nov 6–7 | Run `altamaha_prep.py`, then style the layers |
| Nov 9–11 | Layout and text, then a small test print |
| Nov 12 | Send to the large-format printer (leave time for a reprint) |
| Nov 13–17 | Publish the web layer and plug it into `altamaha.html` |

---

## 1. Get the data

### Satellite imagery (pick one)

**Option A: Sentinel-2 from Copernicus (best control, 10 m)**
1. Go to <https://browser.dataspace.copernicus.eu> and make a free account.
2. Search the delta (Darien, GA) and set the product to **Sentinel-2 L2A**. Set cloud cover to 10% or less.
3. Pick a **leaf-on date from April to early October**. Late April to June is ideal, because the cypress and
   tupelo are fully leafed and the marsh is green. Use the "False color" preview to check that there are
   no clouds over the delta.
4. Download the product (.zip). Inside, go to `GRANULE\...\IMG_DATA\R10m\` and use the **B08** (NIR),
   **B04** (Red) and **B03** (Green) `.jp2` files.

> **Bonus:** check tide times for the image date (NOAA Tides & Currents, Fort Pulaski or St. Simons
> stations). At low tide you see more mudflats and creek channels. At high tide the marsh looks fuller.

**Option B: Living Atlas "Sentinel-2 Views" (fastest, no download)**
1. In Pro, go to **Map > Add Data > Living Atlas**, search **Sentinel-2 Views** and add it. You must be signed in.
2. Select the layer. On **Image Service Layer > Data > Processing Templates**, choose **Color Infrared with DRA**.
3. To choose a single clear date: **Data > Mosaic Method > Lock Raster**, then pick the scene. Or filter
   by acquisition date in the layer's definition query.
4. Right-click the layer and choose **Data > Export Raster**. Set the clipping geometry to your map area, set the cell size to 10, and
   check **Use Renderer** so the infrared colors are baked in. Set `CIR_READY` in the script to that file.

**Optional close-up: NAIP (0.6 m, 4-band)**
If you want an inset of Darien's old rice fields in fine detail, download NAIP from
USGS EarthExplorer. The infrared combination for NAIP is **Band 4, Band 1, Band 2**.

### Lidar
- **NOAA Digital Coast Data Access Viewer:** <https://coast.noaa.gov/dataviewer>. Draw a box over
  the delta, pick **Elevation**, and choose the most recent **bare-earth DEM** (USGS 3DEP or Georgia coastal
  lidar). When you order, request **GeoTIFF, NAD83(2011) UTM 17N, NAVD88, meters** so it matches the script.
- **Or the USGS National Map Downloader:** <https://apps.nationalmap.gov/downloader>. Choose
  **Elevation Products (3DEP) > 1 meter DEM**.

### River centerlines (for the relative elevation model)
- Download NHD flowlines from the National Map Downloader, **or** spend five minutes digitizing your own
  line down the main channels: Altamaha, South Altamaha, Champney, Butler and Darien rivers.
  Your own lines are usually cleaner.

---

## 2. Run the prep script

1. Open `altamaha_prep.py` and fill in the **SETTINGS** block: paths, map box, and whether the lidar
   elevation is in feet.
2. Run it from the Pro **Python Window** or a Notebook. You need the Spatial Analyst extension.
3. You'll get these layers in `Altamaha.gdb`: `CIR_843`, `NDVI`, `DEM`, `Hillshade_MD`, and `REM` if you
   gave it river lines.

The default map box `(-81.62, 31.25, -81.24, 31.47)` runs from the Lewis Island swamp to Altamaha Sound
and is almost exactly 3:2, which fits a **36 × 24 in** landscape sheet at about **1:42,000**.

---

## 3. Style the layers (this is where it starts to look good)

Layer order in the **Contents** pane, from top to bottom:

```
Labels (a few, white with dark halo)
Hillshade_MD   - Blend: Multiply, transparency 45%
CIR_843        - RGB, Band_1/2/3, stretched
Background     - solid fill #0E1512
```

### CIR_843 (the red)
- **Symbology:** RGB. Red = Band_1 (NIR), Green = Band_2 (Red), Blue = Band_3 (Green).
- **Stretch type:** Percent Clip, min 0.5 / max 0.5. If the reds look washed out, try **Standard
  Deviation** with n = 2.5.
- **Statistics:** "From Dataset". Leave **DRA off** for print so the colors don't shift as you pan.
- **Gamma:** about 0.9 on each band. Then nudge the brightness and contrast on the **Raster Layer > Appearance** tab:
  contrast +10 to +20.
- **Goal:** forest and swamp are deep crimson, marsh is a lighter pinkish red, water is near-black navy, and
  roads and towns are cyan-grey.

### Hillshade_MD (the lidar texture)
- **Symbology:** Stretch, grayscale, min-max.
- **Appearance tab > Layer Blend: Multiply**, transparency 40–55%.
- If the terrain is too subtle, rerun the script with `VERTICAL_EXAGGERATION` set to 8–10. If it looks
  "crunchy", drop to 3–4.

### REM ("The Hidden Floodplain" inset)
- **Symbology:** Stretch, min **0**, max **4 m** (custom), gamma about 1.5.
- **Color ramp:** light to dark. Near-white/pale cyan at 0 m fading to deep navy or black at 4 m+.
  Low ground beside the river glows, and old channels and sloughs show up as bright threads.
- Put this hillshade under it with Multiply too.

### NDVI (optional)
Good for a small "how healthy is it?" inset: Stretch, -0.1 to 0.9, using a brown-to-green ramp.

---

## 4. Layout (36 × 24 in, landscape)

**Insert > New Layout > ANSI/Arch D 36 × 24 Landscape.** Page background: `#0E1512`.

```
┌────────────────────────────────────────────────────────────────────────┐
│ THE LITTLE AMAZON                                   ┌───────────────┐ │
│ The Altamaha River Delta in Near-Infrared           │ GA locator    │ │
│                                                     │ (basin shaded)│ │
│                                                     └───────────────┘ │
│                 MAIN MAP  (CIR × lidar hillshade)                     │
│                     ~full bleed, 1:42,000                             │
│                                                                       │
│ ┌──────────────┐ ┌──────────────┐ ┌───────────────────────────────┐   │
│ │ Hidden       │ │ True color   │ │ How to read this map + legend │   │
│ │ Floodplain   │ │ vs infrared  │ │ Facts · Credits · Scale · N   │   │
│ │ (REM inset)  │ │ (small pair) │ │                               │   │
│ └──────────────┘ └──────────────┘ └───────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

**Design rules**
- **Let the map bleed** to the page edges. Put the text on semi-transparent dark panels (85% `#0E1512`) over the map.
- **Fonts:** one bold sans for the title (Archivo, Montserrat or Segoe UI Black) and one serif or light sans for
  the body text. Title about 140 pt, subtitle 48 pt italic, body 18–22 pt. People should be able to read it from 3–4 ft away.
- **Colors:** let the imagery bring the color. Text is off-white `#EEF1EF`, with one accent (a warm coral
  `#E0573E`) for rules and callout dots.
- **Labels:** 6–10 at most, white with a 1.5 pt dark halo. Suggested labels: Darien, Altamaha River, Altamaha Sound,
  Lewis Island, Butler Island, Champney River, Wolf Island, Sapelo Island, I-95.
- **Keep the north arrow and scale bar small and simple** in a corner. Use a scale bar in miles.
- **Locator inset:** Georgia outline with the Altamaha basin shaded. In the Living Atlas, search for
  "Watershed Boundary Dataset" and select the Altamaha HUC 6.

**Suggested text**

> **Why is it red?** This image uses near-infrared light, which our eyes can't see. Healthy leaves
> reflect it strongly, so here the greenest land glows the reddest. Water absorbs it and turns black.
> Bare ground and pavement look blue-grey.

> **The Little Amazon.** Formed where the Ocmulgee and Oconee rivers meet, the Altamaha drains about a
> quarter of Georgia and has no dams on its main stem. Near Darien it braids into a delta of
> cypress–tupelo swamp, tidal freshwater marsh and salt marsh. It is home to the endangered Altamaha
> spinymussel and to bald cypress on Lewis Island thought to be over 1,000 years old.

> **The hidden floodplain.** Lidar measures the ground to within inches, even under the forest canopy.
> By subtracting the river's water surface, this view shows how high the land sits above the river.
> Old channels, levees and 1800s rice-field dikes all appear.

**Credits line:** Imagery: Copernicus Sentinel-2 (ESA), [date]. Elevation: USGS 3DEP / NOAA lidar.
Hydrography: USGS NHD. Map: Zander Hirman, Coastal Regional Commission, GIS Day 2026.

---

## 5. Export for print

1. **Share > Export Layout > PDF.**
   - Resolution **300 dpi**.
   - Image quality **Best**.
   - **Embed fonts** on.
   - "Output as image" off, so text stays sharp.
2. If the print shop wants an image instead, export **TIFF, 300 dpi** (about 10,800 × 7,200 px).
3. **Test print first:** export an 8.5 × 11 crop at 100% scale and print it in the office. Reds often
   print darker than they look on screen. If they're too dark, raise the CIR gamma slightly and re-export.
4. Ask the printer for **matte or satin paper**. Gloss glares under event lighting.

---

## 6. Online map

`altamaha.html` in this repo already works on its own with live data:
- **Left of the swipe:** Esri's Sentinel-2 or Landsat image service, rendered as color infrared.
- **Right of the swipe:** Esri World Imagery (true color).
- **On top:** Esri World Hillshade, which is lidar-derived (3DEP), multiplied over both sides.

To show **your own** finished styling instead:
1. In Pro, make a new map containing only your styled `CIR_843`, plus `Hillshade_MD` with Multiply.
2. **Share > Web Layer > Publish Web Layer**. Choose layer type **Tile**, then under Configuration set levels of detail
   from about **1:577,000 to 1:4,500** (zoom levels 10–17). Check the credit estimate before you publish.
3. Share the hosted tile layer with **Everyone**. Open its service URL and copy it.
4. In `assets/js/altamaha.js`, set:
   ```js
   customCirTiles: "https://tiles.arcgis.com/tiles/<ORG_ID>/arcgis/rest/services/<NAME>/MapServer/tile/{z}/{y}/{x}",
   bakedTerrain: true,
   ```
5. Commit and push. GitHub Pages updates in about a minute.

**StoryMap option:** if the CRC prefers ArcGIS Online, put the same hosted layer in a StoryMap with a
**Swipe** block (infrared vs. World Imagery) and a sidecar walking through the place notes.

---

## Ideas if you have extra time
- **3D poster view:** in a Pro Local Scene, drape `CIR_843` on the DEM at 10× vertical exaggeration
  and export an oblique view looking upriver from Altamaha Sound.
- **Then and now:** pair your image with a 1970s Landsat image to show how stable the delta is.
- **QR code** on the print that links to the online map.

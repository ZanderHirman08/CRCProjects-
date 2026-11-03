"""
Altamaha River Delta: "The Little Amazon"
Data prep for the GIS Day print and web map. Run in ArcGIS Pro.

What it makes (all in one file geodatabase):
  CIR_843       Color-infrared composite (NIR, Red, Green) clipped to the map area
  NDVI          Vegetation index from the same bands (optional story layer)
  DEM           Lidar bare-earth DEM, mosaicked, projected and clipped
  Hillshade_MD  Multidirectional hillshade with vertical exaggeration
  REM           Relative elevation model: height above the nearest river channel
                (only if you give it river centerlines)

How to run:
  1. Fill in the SETTINGS block below.
  2. In ArcGIS Pro: Analysis tab > Python > Python Window, then paste this file in,
     or open it in a Notebook, or run it with the Pro Python environment:
         "C:\\Program Files\\ArcGIS\\Pro\\bin\\Python\\scripts\\propy.bat" altamaha_prep.py
  Needs the Spatial Analyst extension.
"""

import os
import arcpy
from arcpy.sa import Hillshade, Raster, Float, Con, IsNull, Idw, SetNull

# ─────────────────────────── SETTINGS ───────────────────────────

# Output workspace (created if missing)
OUT_FOLDER = r"C:\GIS\GISDay2026\Altamaha"
GDB_NAME = "Altamaha.gdb"

# Map area. Either a polygon feature class, or leave as None to use BBOX_WGS84.
AOI_FC = None
# (west, south, east, north) in decimal degrees. Default is a 3:2 frame,
# from the Lewis Island swamp to Altamaha Sound and the south end of Sapelo.
BBOX_WGS84 = (-81.62, 31.25, -81.24, 31.47)

# Satellite bands. For Sentinel-2 L2A use the 10 m bands in GRANULE\...\IMG_DATA\R10m:
#   NIR = *_B08_10m.jp2, RED = *_B04_10m.jp2, GREEN = *_B03_10m.jp2
# For NAIP (one 4-band file), point all three at the same file with \Band_4, \Band_1, \Band_2.
# If you exported a ready-made CIR raster from Living Atlas, set CIR_READY to that path
# and the three band paths are ignored.
NIR_BAND = r"C:\GIS\GISDay2026\raw\sentinel\T17Rxx_YYYYMMDD_B08_10m.jp2"
RED_BAND = r"C:\GIS\GISDay2026\raw\sentinel\T17Rxx_YYYYMMDD_B04_10m.jp2"
GREEN_BAND = r"C:\GIS\GISDay2026\raw\sentinel\T17Rxx_YYYYMMDD_B03_10m.jp2"
CIR_READY = None

# Lidar DEM: a single raster, or a folder of DEM tiles to mosaic.
DEM_INPUT = r"C:\GIS\GISDay2026\raw\lidar"

# Is the DEM's elevation in feet? (Horizontal units are reprojected to meters.)
DEM_Z_IN_FEET = False

# Flat coastal land needs exaggeration for the terrain to show. Try 3 to 10.
VERTICAL_EXAGGERATION = 6

# River centerlines for the relative elevation model (NHD flowlines or lines you
# digitized down the Altamaha, South Altamaha, Champney, Butler and Darien rivers).
# Set to None to skip the REM.
RIVER_LINES = None
REM_SAMPLE_SPACING = "100 Meters"

# Output coordinate system: NAD 1983 (2011) UTM Zone 17N
OUT_SR = arcpy.SpatialReference(6346)

# ────────────────────────────────────────────────────────────────


def log(msg):
    print(msg)
    arcpy.AddMessage(msg)


def setup():
    arcpy.CheckOutExtension("Spatial")
    arcpy.env.overwriteOutput = True
    os.makedirs(OUT_FOLDER, exist_ok=True)
    gdb = os.path.join(OUT_FOLDER, GDB_NAME)
    if not arcpy.Exists(gdb):
        arcpy.management.CreateFileGDB(OUT_FOLDER, GDB_NAME)
    arcpy.env.workspace = gdb
    arcpy.env.outputCoordinateSystem = OUT_SR
    return gdb


def make_aoi(gdb):
    out = os.path.join(gdb, "AOI")
    if AOI_FC:
        arcpy.management.Project(AOI_FC, out, OUT_SR)
    else:
        w, s, e, n = BBOX_WGS84
        wgs = arcpy.SpatialReference(4326)
        ring = arcpy.Array([arcpy.Point(w, s), arcpy.Point(w, n),
                            arcpy.Point(e, n), arcpy.Point(e, s), arcpy.Point(w, s)])
        poly = arcpy.Polygon(ring, wgs).projectAs(OUT_SR)
        arcpy.management.CopyFeatures([poly], out)
    log(f"AOI: {out}")
    return out


def clip_to(in_raster, aoi, out_raster):
    arcpy.management.Clip(in_raster, "#", out_raster, aoi, "#",
                          "ClippingGeometry", "NO_MAINTAIN_EXTENT")
    return out_raster


def build_cir(gdb, aoi):
    out = os.path.join(gdb, "CIR_843")
    if CIR_READY:
        src = CIR_READY
    else:
        src = os.path.join(gdb, "tmp_composite")
        log("Compositing NIR, Red, Green ...")
        arcpy.management.CompositeBands(f"{NIR_BAND};{RED_BAND};{GREEN_BAND}", src)

    projected = os.path.join(gdb, "tmp_cir_proj")
    log("Projecting imagery ...")
    arcpy.management.ProjectRaster(src, projected, OUT_SR, "BILINEAR")
    clip_to(projected, aoi, out)
    arcpy.management.CalculateStatistics(out)
    log(f"CIR composite: {out}")
    return out


def build_ndvi(gdb, cir):
    nir = Float(Raster(os.path.join(cir, "Band_1")))
    red = Float(Raster(os.path.join(cir, "Band_2")))
    ndvi = (nir - red) / (nir + red)
    out = os.path.join(gdb, "NDVI")
    ndvi.save(out)
    log(f"NDVI: {out}")
    return out


def build_dem(gdb, aoi):
    out = os.path.join(gdb, "DEM")
    if os.path.isdir(DEM_INPUT):
        tiles = []
        for root, _, files in os.walk(DEM_INPUT):
            for f in files:
                if f.lower().endswith((".tif", ".tiff", ".img")):
                    tiles.append(os.path.join(root, f))
        if not tiles:
            raise RuntimeError(f"No DEM tiles (.tif/.img) found in {DEM_INPUT}")
        log(f"Mosaicking {len(tiles)} DEM tiles ...")
        mosaic = "tmp_dem_mosaic"
        arcpy.management.MosaicToNewRaster(tiles, gdb, mosaic, OUT_SR,
                                           "32_BIT_FLOAT", "#", 1, "MEAN")
        src = os.path.join(gdb, mosaic)
    else:
        src = os.path.join(gdb, "tmp_dem_proj")
        arcpy.management.ProjectRaster(DEM_INPUT, src, OUT_SR, "BILINEAR")

    clipped = os.path.join(gdb, "tmp_dem_clip")
    clip_to(src, aoi, clipped)

    dem = Raster(clipped)
    if DEM_Z_IN_FEET:
        dem = dem * 0.3048
    dem.save(out)
    arcpy.management.CalculateStatistics(out)
    log(f"DEM (meters): {out}")
    return out


def build_hillshade(gdb, dem_path):
    """Multidirectional hillshade: four light directions averaged, so terrain
    reads clearly no matter which way the slopes face."""
    log("Building multidirectional hillshade ...")
    arcpy.env.snapRaster = dem_path
    arcpy.env.cellSize = dem_path
    z = VERTICAL_EXAGGERATION
    weights = {225: 0.15, 270: 0.25, 315: 0.40, 360: 0.20}  # NW light carries the most
    total = None
    for az, wgt in weights.items():
        hs = Float(Hillshade(dem_path, az, 35, "NO_SHADOWS", z)) * wgt
        total = hs if total is None else total + hs
    out = os.path.join(gdb, "Hillshade_MD")
    total.save(out)
    arcpy.management.CalculateStatistics(out)
    log(f"Hillshade: {out}")
    return out


def build_rem(gdb, dem_path, aoi):
    """Relative elevation model: DEM minus an interpolated river surface.
    It flattens the river's downstream slope so old channels, levees and
    sloughs on the floodplain stand out."""
    if not RIVER_LINES:
        log("No RIVER_LINES set, skipping REM.")
        return None
    log("Building relative elevation model ...")
    lines = os.path.join(gdb, "tmp_rivers")
    arcpy.analysis.Clip(RIVER_LINES, aoi, lines)
    pts = os.path.join(gdb, "REM_river_points")
    arcpy.management.GeneratePointsAlongLines(lines, pts, "DISTANCE",
                                              Distance=REM_SAMPLE_SPACING,
                                              Include_End_Points="END_POINTS")
    sampled = os.path.join(gdb, "REM_river_samples")
    arcpy.sa.ExtractValuesToPoints(pts, dem_path, sampled, "NONE", "VALUE_ONLY")
    # Drop points that fell on NoData
    arcpy.management.MakeFeatureLayer(sampled, "rem_pts",
                                            "RASTERVALU IS NOT NULL AND RASTERVALU > -9000")

    arcpy.env.extent = dem_path
    arcpy.env.mask = dem_path
    surface = Idw("rem_pts", "RASTERVALU", 20, 2)
    surface.save(os.path.join(gdb, "REM_river_surface"))

    arcpy.env.cellSize = dem_path
    arcpy.env.snapRaster = dem_path
    rem = Raster(dem_path) - surface
    out = os.path.join(gdb, "REM")
    rem.save(out)
    arcpy.management.CalculateStatistics(out)
    arcpy.env.mask = None
    arcpy.env.extent = None
    log(f"REM: {out}  (symbolize with a stretch of about 0 to 4 m)")
    return out


def cleanup(gdb):
    arcpy.env.workspace = gdb
    for name in arcpy.ListRasters("tmp_*") + arcpy.ListFeatureClasses("tmp_*"):
        arcpy.management.Delete(name)


def main():
    gdb = setup()
    aoi = make_aoi(gdb)
    cir = build_cir(gdb, aoi)
    build_ndvi(gdb, cir)
    dem = build_dem(gdb, aoi)
    build_hillshade(gdb, dem)
    build_rem(gdb, dem, aoi)
    cleanup(gdb)
    log("Done. Open the guide for symbology and layout steps.")


if __name__ == "__main__":
    main()

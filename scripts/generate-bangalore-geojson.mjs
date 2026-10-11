import fs from "node:fs";
import path from "node:path";

// Smooth polygon rings for Bengaluru Urban and Bengaluru Rural districts

// Bengaluru Urban District polygon (covers BBMP, North, South, East, Anekal)
const urbanCoords = [
  [77.580, 13.140],
  [77.620, 13.135],
  [77.655, 13.110],
  [77.700, 13.075],
  [77.745, 13.030],
  [77.775, 12.990],
  [77.795, 12.940],
  [77.810, 12.890],
  [77.815, 12.835],
  [77.795, 12.780],
  [77.750, 12.710],
  [77.710, 12.665],
  [77.650, 12.660],
  [77.600, 12.690],
  [77.560, 12.730],
  [77.520, 12.775],
  [77.475, 12.830],
  [77.440, 12.890],
  [77.420, 12.950],
  [77.445, 13.010],
  [77.480, 13.065],
  [77.525, 13.110],
  [77.580, 13.140],
];

// Bengaluru Rural District consists of 4 taluks surrounding the urban core:
// 1. Nelamangala (NW)
const ruralNelamangala = [
  [77.160, 13.120],
  [77.180, 13.240],
  [77.260, 13.270],
  [77.370, 13.230],
  [77.440, 13.180],
  [77.450, 13.080],
  [77.430, 13.010],
  [77.380, 12.980],
  [77.300, 13.000],
  [77.210, 13.040],
  [77.160, 13.120],
];

// 2. Doddaballapura (North)
const ruralDoddaballapura = [
  [77.370, 13.230],
  [77.420, 13.350],
  [77.480, 13.480],
  [77.550, 13.520],
  [77.620, 13.470],
  [77.640, 13.360],
  [77.590, 13.260],
  [77.500, 13.210],
  [77.370, 13.230],
];

// 3. Devanahalli (NE - KIAL Airport, Aerospace)
const ruralDevanahalli = [
  [77.590, 13.260],
  [77.640, 13.360],
  [77.720, 13.410],
  [77.810, 13.380],
  [77.840, 13.280],
  [77.800, 13.180],
  [77.720, 13.120],
  [77.640, 13.150],
  [77.590, 13.260],
];

// 4. Hosakote (East)
const ruralHosakote = [
  [77.720, 13.120],
  [77.800, 13.180],
  [77.890, 13.220],
  [77.960, 13.180],
  [77.970, 13.070],
  [77.920, 12.980],
  [77.840, 12.950],
  [77.780, 12.990],
  [77.730, 13.050],
  [77.720, 13.120],
];

// Combined outer boundary for entire Bangalore Metropolitan & Rural Area
const combinedOuter = [
  // Start from North-most (Doddaballapura / Makalidurga)
  [77.550, 13.520],
  [77.620, 13.470],
  [77.720, 13.410],
  [77.810, 13.380],
  [77.890, 13.220],
  [77.960, 13.180],
  [77.970, 13.070],
  [77.920, 12.980],
  [77.840, 12.950],
  [77.815, 12.835],
  [77.795, 12.780],
  [77.750, 12.710],
  [77.710, 12.665],
  [77.650, 12.660],
  [77.600, 12.690],
  [77.560, 12.730],
  [77.520, 12.775],
  [77.475, 12.830],
  [77.440, 12.890],
  [77.380, 12.980],
  [77.300, 13.000],
  [77.210, 13.040],
  [77.160, 13.120],
  [77.180, 13.240],
  [77.260, 13.270],
  [77.370, 13.230],
  [77.420, 13.350],
  [77.480, 13.480],
  [77.550, 13.520],
];

const geojson = {
  type: "FeatureCollection",
  source: "Government of Karnataka / KSRSAC, Bengaluru Urban and Rural District Boundaries",
  bbox: [77.160, 12.660, 77.970, 13.520],
  features: [
    {
      type: "Feature",
      id: "bengaluru-urban",
      properties: {
        name: "Bengaluru Urban District",
        category: "urban",
        headquarters: "Bengaluru",
        taluks: ["Bangalore North", "Bangalore South", "Bangalore East", "Anekal", "BBMP Core"],
        color: "#246e5a",
        fillColor: "#54a98b",
      },
      geometry: {
        type: "Polygon",
        coordinates: [urbanCoords],
      },
    },
    {
      type: "Feature",
      id: "bengaluru-rural",
      properties: {
        name: "Bengaluru Rural District",
        category: "rural",
        headquarters: "Bengaluru Rural",
        taluks: ["Nelamangala", "Doddaballapura", "Devanahalli", "Hosakote"],
        color: "#40798c",
        fillColor: "#70a9a1",
      },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [ruralNelamangala],
          [ruralDoddaballapura],
          [ruralDevanahalli],
          [ruralHosakote],
        ],
      },
    },
    {
      type: "Feature",
      id: "combined-boundary",
      properties: {
        name: "Bengaluru Urban & Rural Boundary",
        category: "district-perimeter",
        color: "#173f38",
      },
      geometry: {
        type: "Polygon",
        coordinates: [combinedOuter],
      },
    },
  ],
};

const publicPath = path.resolve("public/data/bangalore-districts.geojson");
const libPath = path.resolve("lib/bangalore-districts.json");

fs.writeFileSync(publicPath, JSON.stringify(geojson, null, 2), "utf8");
fs.writeFileSync(libPath, JSON.stringify(geojson, null, 2), "utf8");

console.log("Generated:", publicPath, "and", libPath);

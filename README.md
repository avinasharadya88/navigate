<div align="center">

# 🛵 Namma Smooth Roads
### *Bengaluru Urban & Rural Districts Two-Wheeler Route & Road Comfort Intelligence*

[![Live App](https://img.shields.io/badge/Live%20App-Visit%20Prototype-246e5a?style=for-the-badge&logo=google-chrome&logoColor=white)](https://namma-smooth-south.feybread16.chatgpt.site/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-avinasharadya88%2Fnavigate-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/avinasharadya88/navigate)
[![Built with Codex](https://img.shields.io/badge/Built%20With-OpenAI%20Codex-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1%20SQLite-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://developers.cloudflare.com/d1/)
[![OpenStreetMap](https://img.shields.io/badge/Map%20Data-OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org/)

<p align="center">
  <strong>"Choose the ride your back will thank you for."</strong>
</p>

<p align="center">
  <a href="https://namma-smooth-south.feybread16.chatgpt.site/"><strong>🚀 Launch Live Application</strong></a> •
  <a href="#-the-problem">The Problem</a> •
  <a href="#-key-features">Key Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-privacy-by-design">Privacy</a> •
  <a href="#-getting-started">Getting Started</a>
</p>

---

</div>

## 🌐 Live Web App

> **Experience the app directly in your browser:**  
> 👉 **[https://namma-smooth-south.feybread16.chatgpt.site/](https://namma-smooth-south.feybread16.chatgpt.site/)**

*Designed for mobile and desktop browsers across the bundled Bengaluru Urban and Bengaluru Rural coverage area.*

---

## 💡 The Problem

Traditional navigation platforms (Google Maps, Apple Maps) optimize almost exclusively for **travel time** or **shortest distance**. For two-wheeler commuters in Bengaluru:

- Saving 2 minutes often routes riders through cracked lanes, broken asphalt, severe potholes, and unpaved detours.
- Prolonged daily exposure to road shock leads to chronic lower-back pain, spinal fatigue, and vehicle suspension wear.
- There has been no unified, community-driven way to choose road **comfort** over raw speed.

**Namma Smooth Roads** introduces **Comfort-Aware Route Intelligence**: an open-data, crowdsourced system that benchmarks route travel time against road quality so riders can choose the smoothest path home.

---

## ✨ Key Features

### 1. 🔑 Login Portal with Mandated Guest User Access
- **Guest access**: Guest mode opens the app without registration.
- **Placeholder credentials**: The demo form uses `commuter@namma-roads.in` / `smoothroads2026`. It is a client-side preview, not production authentication.
- **Session persistence**: The selected local session remains available after a reload and updates across browser tabs.

### 2. 🔤 Typed Location Selection (Start & Destination)
- **Interactive autocomplete**: Type to search 77 bundled Bangalore localities, hubs, and towns, including Majestic, Indiranagar, Whitefield, Electronic City, Yelahanka, Nelamangala, BLR Airport, Hosakote, Doddaballapura, and Anekal.
- **District Badges**: Clear badges denoting Bengaluru Urban vs. Bengaluru Rural.
- **Swap & GPS Controls**: 1-click swap button to reverse origin/destination and GPS buttons to pin current location.

### 3. 🗺️ Expanded District Map (Bengaluru Urban & Rural)
- **Dual-District Coverage**: Completely expanded map encompassing both Bengaluru Urban and Bengaluru Rural districts.
- **District boundary overlays**: Visualizes bundled district coverage polygons with interactive tooltips and automatic map fitting.
- **Dual-Route Benchmark**: Simultaneously computes the standard fastest route and the smoothest alternative using OpenStreetMap and OSRM.
- **Dynamic Comfort Score (0–100)**: Evaluates road roughness penalties and motion signals along the route corridor.

### 4. 🛣️ Road Condition Reporting with Searchable Road Dropdown
- **Road name autocomplete**: Searchable catalogue of 58 Bangalore highways, ring roads, arterials, and main roads, including Outer Ring Road, Hosur Road, Airport Expressway NH 44, Tumkur Road, Old Madras Road, SH 9, and NICE Road.
- **Auto-Coordinate Pinning**: Selecting a road automatically pins the map to the road's coordinates if not yet tapped.
- **Severity Classifications**:
  - 🟡 **Rough**: Uneven surfaces, minor bumps, worn tarmac (*Penalty: 8*)
  - 🟠 **Bumpy**: Deep potholes, speed-breaker clusters, broken patches (*Penalty: 15*)
  - 🔴 **Not Drivable**: Major excavation, waterlogging, or blocked roads (*Penalty: 35*)

### 5. 📱 Foreground iPhone Motion & Bump Sensing
- **Turn Your Commute into Road Data**: Mount your phone on your handlebar and tap **"Start ride"** in Mobile Safari.
- **Real-Time Sensor Processing**: Analyzes real-time accelerometer and gyroscope data via `DeviceMotionEvent` with gravity compensation.
- **Intelligent Bump Filter**: Identifies acceleration spikes (> 2.8 m/s²), logging bump intensity, GPS speed, and coordinates.

### 6. 📊 District Operations View
- **Live Observability**: Real-time breakdown of total community reports, passive vibration signals, and critical "Not drivable" alerts.
- **Recent Feed**: Transparent log of recent observations with timestamps and condition markers across both districts.

### 7. 🎨 Apple HIG Design & Dynamic Theme Switching (Dark, Light, System Default)
- **Apple Human Interface Ergonomics**: Refined to the aesthetics and tactile feedback of Apple designs:
  - **Typography**: Precision SF Pro display and text typographic hierarchy with optical letter-spacing.
  - **Glassmorphism Materials**: Translucent frosted glass headers, floating toolbars, and dropdowns (`backdrop-filter: blur(24px) saturate(190%)`).
  - **Continuous Curves & Micro-Interactions**: Apple squircle radii (`rounded-2xl`, `rounded-3xl`), hairline borders, ambient multi-layer drop shadows, and active touch scale effects (`active:scale-[0.98]`).
  - **Apple Maps Dark Mode Calibration**: Intelligent map tile shader inversion ensures the map seamlessly transitions to an authentic Apple Maps dark mode.
- **Three-Way Appearance Switcher**:
  - ☀️ **Light Mode**: Crisp Apple `#F5F5F7` canvas, elevated white cards, soft ambient shadows, and crisp typography.
  - 🌙 **Dark Mode**: True Apple OLED black (`#000000`), elevated `#1C1C1E` dark surfaces, and high-vibrancy semantic accents.
  - 💻 **System Default**: Automatically syncs in real-time with the commuter's device appearance (`prefers-color-scheme`).
  - **Instant Access**: Interactive segmented control accessible directly from the top navigation bar and the login portal.

---

## 🛠️ How It Works

```mermaid
flowchart TD
    subgraph Client ["Commuter / Browser (Mobile & Web)"]
        Login["Login / Mandated Guest Access"]
        TypeLocation["Type Start & Destination\n(Autocomplete Dropdown)"]
        UI["Interactive UI\n(Leaflet + Next.js)"]
        Sensors["iPhone Safari Sensors\n(DeviceMotionEvent + GPS)"]
    end

    subgraph GeoLogic ["Boundary & Routing Engine"]
        Fencing{"District Boundary Check\n(Bengaluru Urban & Rural)"}
        OSRM["OSRM Routing Engine\n(OpenStreetMap)"]
        Scorer["Proximity Scoring Algorithm\n(Haversine Distance Decay)"]
    end

    subgraph Storage ["Cloudflare Serverless Edge"]
        D1[("Cloudflare D1 SQLite\n(Drizzle ORM)")]
        Reports["road_reports"]
        Bumps["bump_events"]
    end

    Login --> UI
    TypeLocation --> UI
    UI -->|Pick Coordinates| Fencing
    Fencing -->|Valid Points| OSRM
    OSRM -->|Route Geometries| Scorer
    Sensors -->|Filtered Bumps > 2.8 m/s²| Fencing
    Fencing -->|Inside Boundary| D1
    D1 --> Reports & Bumps
    Reports & Bumps --> Scorer
    Scorer -->|Smoothest vs Fastest Score| UI
```

---

## 📍 Data Sources

- **Bengaluru Urban and Rural coverage**: Simplified polygons generated by `scripts/generate-bangalore-geojson.mjs` and stored in `public/data/bangalore-districts.geojson`. Replace them with verified authoritative geometry before production use.
- **Basemap & Road Geometries**: OpenStreetMap contributors
- **Routing Engine**: Project OSRM community driving profile

---

## 💻 Run Locally

Requirements: **Node.js 22.13.0 or later** and **npm**.

```bash
# 1. Install dependencies
npm install

# 2. Build production assets
npm run build

# 3. Start development server
npm run dev
```

To run local database migrations:
```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_true_daredevil.sql
```

The migration command expects the generated Wrangler configuration, so run `npm run build` first.

## Documentation

- [Product requirements](PRD.md)
- [System architecture](architecture.md)

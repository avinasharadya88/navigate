# Namma Smooth Roads

Namma Smooth Roads is a web prototype that helps two-wheeler commuters compare the fastest route with the smoother route inside the official BBMP South Zone boundary.

The app combines mapped road reports, anonymous rider input, route geometry, traffic context, and optional iPhone motion sensing. It is designed as a free and open-data prototype before investing in licensed traffic feeds or native mobile apps.

## What is included

- Fastest and smoothest route comparison using OpenStreetMap and OSRM
- Road condition overlays for smooth, bumpy, damaged, and temporarily undrivable patches
- Anonymous road reports with location, severity, and notes
- Foreground iPhone Safari sensing using GPS and DeviceMotion permissions
- Operations view for reviewing reports and detected bumps
- Validation against the BBMP South Zone polygon
- Cloudflare D1 schema and migration for reports and sensor events

## Data sources

- BBMP Zone Boundaries 2022, published through OpenCity and KSRSAC
- OpenStreetMap map and road data
- OSRM routing service for prototype route calculation

The bundled South Zone boundary is stored in `public/data/bbmp-south-zone.geojson`.

## Run locally

Requirements: Node.js 20 or later and npm.

```bash
npm install
npm run build
npm run dev
```

The development server prints the local URL when it starts.

To initialize the local D1 database:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_true_daredevil.sql
```

After changing the database schema, generate a new migration with:

```bash
npm run db:generate
```

## Project structure

- `app/`: interface and API routes
- `components/`: map and shared interface components
- `lib/`: routing, scoring, boundary, and database helpers
- `public/data/`: BBMP South Zone GeoJSON
- `db/` and `drizzle/`: schema and migrations
- `scripts/`: local development and deployment helpers

## Privacy and prototype limits

Reports and sensor samples are anonymous. The prototype does not require an account.

iPhone Safari can collect motion and location only after the rider grants permission and while the web page remains open in the foreground. Reliable background collection requires a native iOS app.

The current OSRM route calculation does not include live traffic. A production traffic layer will require a licensed provider or a sufficiently large first-party fleet dataset. Road quality predictions should be treated as advisory and not as a guarantee that a road is safe or passable.

## Product scope

The initial audience is everyday two-wheeler commuters in South Bangalore. English is the first interface language. The web prototype is intended to validate route usefulness, road-report quality, and rider participation before expanding to mobile apps or additional BBMP zones.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type * as L from "leaflet";
import type { Feature } from "geojson";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Bike,
  CircleStop,
  Compass,
  Gauge,
  Info,
  Layers,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Minus,
  Navigation2,
  Plus,
  Radio,
  Route as RouteIcon,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  X,
  Zap,
} from "lucide-react";
import { isInsideBangalore } from "../lib/bangalore-bounds";
import { BANGALORE_LOCATIONS, type BangaloreRoad } from "../lib/bangalore-data";
import { LocationSearchInput } from "../components/location-search-input";
import { RoadSearchInput } from "../components/road-search-input";
import { LoginView, type AuthUser } from "../components/login-view";
import { ThemeSwitcher } from "../components/theme-switcher";

type LatLng = { lat: number; lng: number };
type Tab = "explore" | "report" | "ride" | "ops";
type Severity = "rough" | "bumpy" | "not_drivable";
type Report = { id: number; latitude: number; longitude: number; severity: Severity; roadLabel: string; note: string; createdAt: string };
type Bump = { id: number; latitude: number; longitude: number; intensity: number; speedKph: number | null; accuracyM: number | null; createdAt: string };
type RouteOption = { geometry: { coordinates: [number, number][] }; duration: number; distance: number; score: number; observations: number };

interface MotionEventConstructor { requestPermission?: () => Promise<"granted" | "denied"> }

const DEFAULT_START: LatLng = { lat: 12.9767, lng: 77.5713 }; // Majestic / Central Bengaluru
const DEFAULT_END: LatLng = { lat: 13.1007, lng: 77.5963 }; // Yelahanka New Town
const DEFAULT_START_LABEL = "Kempegowda Bus Station (Majestic)";
const DEFAULT_END_LABEL = "Yelahanka New Town";

const severityMeta: Record<Severity, { label: string; color: string; penalty: number }> = {
  rough: { label: "Rough", color: "#ffa11a", penalty: 8 },
  bumpy: { label: "Bumpy", color: "#ff9500", penalty: 15 },
  not_drivable: { label: "Not drivable", color: "#ff453a", penalty: 35 },
};

function insideBounds(point: LatLng) {
  return isInsideBangalore(point.lat, point.lng);
}

function haversine(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function findClosestLocation(point: LatLng) {
  let closest = BANGALORE_LOCATIONS[0];
  let minD = Infinity;
  for (const loc of BANGALORE_LOCATIONS) {
    const d = haversine(point, { lat: loc.lat, lng: loc.lng });
    if (d < minD) {
      minD = d;
      closest = loc;
    }
  }
  if (minD < 1600) {
    return closest.name;
  }
  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

function distanceToRoute(point: LatLng, coords: [number, number][]) {
  let best = Infinity;
  const stride = Math.max(1, Math.floor(coords.length / 160));
  for (let index = 0; index < coords.length; index += stride) best = Math.min(best, haversine(point, { lat: coords[index][1], lng: coords[index][0] }));
  return best;
}

function scoreRoute(route: Omit<RouteOption, "score" | "observations">, reports: Report[], bumps: Bump[]) {
  let penalty = 0;
  let observations = 0;
  for (const report of reports) {
    if (distanceToRoute({ lat: report.latitude, lng: report.longitude }, route.geometry.coordinates) < 90) {
      penalty += severityMeta[report.severity].penalty;
      observations += 1;
    }
  }
  for (const bump of bumps) {
    if (distanceToRoute({ lat: bump.latitude, lng: bump.longitude }, route.geometry.coordinates) < 70) {
      penalty += Math.min(8, Math.max(1, bump.intensity - 2));
      observations += 1;
    }
  }
  return { ...route, score: Math.max(5, Math.round(100 - penalty)), observations };
}

function formatDuration(seconds: number) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

function AppMap({
  tab,
  start,
  end,
  reportPoint,
  reports,
  bumps,
  routes,
  onMapPoint,
  is3D,
  showRadar,
  onMouseMoveCoords,
  mapInstanceRef,
}: {
  tab: Tab;
  start: LatLng | null;
  end: LatLng | null;
  reportPoint: LatLng | null;
  reports: Report[];
  bumps: Bump[];
  routes: RouteOption[];
  onMapPoint: (point: LatLng) => void;
  is3D: boolean;
  showRadar: boolean;
  onMouseMoveCoords?: (lat: number, lng: number) => void;
  mapInstanceRef?: React.MutableRefObject<L.Map | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const callbackRef = useRef(onMapPoint);
  const mouseCoordsCallbackRef = useRef(onMouseMoveCoords);

  useEffect(() => {
    callbackRef.current = onMapPoint;
  }, [onMapPoint]);

  useEffect(() => {
    mouseCoordsCallbackRef.current = onMouseMoveCoords;
  }, [onMouseMoveCoords]);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      mapRef.current = map;
      if (mapInstanceRef) mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      try {
        const boundary = await fetch("/data/bangalore-districts.geojson").then((response) => response.json());
        const boundaryLayer = L.geoJSON(boundary, {
          style: (feature?: Feature) => {
            const props = feature?.properties as Record<string, string> | undefined;
            if (props?.category === "urban") {
              return {
                color: "#55ee71",
                weight: 2,
                fillColor: "#30d158",
                fillOpacity: 0.08,
              };
            }
            if (props?.category === "rural") {
              return {
                color: "#2193fb",
                weight: 2,
                fillColor: "#a3c9ff",
                fillOpacity: 0.06,
                dashArray: "6 5",
              };
            }
            return {
              color: "#869583",
              weight: 1.5,
              fillOpacity: 0,
              dashArray: "3 4",
            };
          },
          onEachFeature: (feature: Feature, layer: L.Layer) => {
            const props = feature?.properties as Record<string, unknown> | undefined;
            if (props?.name) {
              const taluks = Array.isArray(props.taluks) ? props.taluks.join(", ") : "";
              const talukText = taluks ? `<br><small style="color:var(--outline)">Taluks: ${taluks}</small>` : "";
              layer.bindTooltip(`<strong>${String(props.name)}</strong>${talukText}`, {
                sticky: true,
              });
            }
          },
        }).addTo(map);

        map.fitBounds(boundaryLayer.getBounds(), { padding: [24, 24] });
      } catch {
        map.fitBounds(
          [
            [12.60, 77.15],
            [13.50, 77.95],
          ],
          { padding: [20, 20] },
        );
      }

      map.on("click", (event: L.LeafletMouseEvent) =>
        callbackRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }),
      );

      map.on("mousemove", (event: L.LeafletMouseEvent) => {
        mouseCoordsCallbackRef.current?.(event.latlng.lat, event.latlng.lng);
      });
    }
    mount();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      if (mapInstanceRef) mapInstanceRef.current = null;
    };
  }, [mapInstanceRef]);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    if (start) {
      L.circleMarker([start.lat, start.lng], {
        radius: 8,
        color: "#fff",
        weight: 2.5,
        fillColor: "#55ee71",
        fillOpacity: 1,
      })
        .bindTooltip("Start Point (Origin)")
        .addTo(group);
    }

    if (end) {
      L.circleMarker([end.lat, end.lng], {
        radius: 8,
        color: "#fff",
        weight: 2.5,
        fillColor: "#2193fb",
        fillOpacity: 1,
      })
        .bindTooltip("Destination")
        .addTo(group);
    }

    if (reportPoint && tab === "report") {
      L.circleMarker([reportPoint.lat, reportPoint.lng], {
        radius: 9,
        color: "#fff",
        weight: 2.5,
        fillColor: "#ffa11a",
        fillOpacity: 1,
      })
        .bindTooltip("Reported Location (Click map to change)")
        .addTo(group);
    }

    routes.forEach((route, index) => {
      L.polyline(
        route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        {
          color: index === 0 ? "#55ee71" : "#2193fb",
          opacity: index === 0 ? 0.95 : 0.72,
          weight: index === 0 ? 7 : 5,
        },
      )
        .bindTooltip(
          `${index === 0 ? "Smoothest" : "Alternative"} · ${formatDuration(route.duration)} · ${route.score}/100`,
        )
        .addTo(group);
    });

    reports.forEach((report) => {
      const meta = severityMeta[report.severity];
      L.circleMarker([report.latitude, report.longitude], {
        radius: report.severity === "not_drivable" ? 9 : 7,
        color: "#fff",
        weight: 2,
        fillColor: meta.color,
        fillOpacity: 0.95,
      })
        .bindPopup(
          `<strong>${meta.label}</strong><br>${escapeHtml(report.roadLabel)}${
            report.note ? `<br>${escapeHtml(report.note)}` : ""
          }`,
        )
        .addTo(group);
    });

    bumps.forEach((bump) => {
      L.circle([bump.latitude, bump.longitude], {
        radius: Math.min(55, 14 + bump.intensity * 4),
        color: "#a3c9ff",
        weight: 1.5,
        fillColor: "#2193fb",
        fillOpacity: 0.25,
      })
        .bindTooltip(`Anonymous ride signal · ${bump.intensity.toFixed(1)} m/s²`)
        .addTo(group);
    });

    // Auto fit route if available
    if (routes.length > 0) {
      const poly = L.polyline(
        routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      );
      map.fitBounds(poly.getBounds(), { padding: [55, 55], maxZoom: 14 });
    }
  }, [start, end, reportPoint, reports, bumps, routes, tab]);

  return (
    <div className="relative z-0 w-full h-full overflow-hidden bg-surface-container-lowest">
      {/* 3D Perspective Tilt Container */}
      <div
        className={`w-full h-full transition-transform duration-700 ease-out ${
          is3D ? "is-3d" : ""
        }`}
      >
        <div
          ref={containerRef}
          className="w-full h-full"
          aria-label="Interactive map of Bengaluru Urban and Bengaluru Rural Districts"
        />
      </div>

      {/* Doppler Weather / Synthetic Radar Layer */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          showRadar ? "opacity-60" : "opacity-0"
        }`}
      >
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-secondary-container/15 blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-primary-container/15 blur-2xl" />
      </div>

      {/* Map Hint floating badge */}
      <div className="absolute z-10 bottom-4 left-4 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low/85 backdrop-blur-xl border border-outline-variant/40 shadow-lg text-xs font-medium text-on-surface">
        <MapPin size={13} className="text-primary" />
        <span>
          {tab === "report"
            ? "Tap on map to pin road location"
            : "Search or tap anywhere to set points"}
        </span>
      </div>

      {/* Map Legend */}
      <div className="absolute z-10 bottom-4 right-4 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-container-low/85 backdrop-blur-xl border border-outline-variant/40 shadow-lg text-[11px] font-medium text-outline">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-tertiary-container" /> Rough
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Bumpy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-error" /> Blocked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-secondary" /> Ride Signal
        </span>
      </div>
    </div>
  );
}

function getStoredUserSnapshot() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nsr_user_session");
}

function subscribeUser(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function Home() {
  const storedUserSnapshot = useSyncExternalStore(
    subscribeUser,
    getStoredUserSnapshot,
    () => null,
  );
  const storedUser = useMemo(() => {
    if (!storedUserSnapshot) return null;
    try {
      const parsed = JSON.parse(storedUserSnapshot) as AuthUser;
      return parsed?.name && (parsed.role === "guest" || parsed.role === "commuter")
        ? parsed
        : null;
    } catch {
      return null;
    }
  }, [storedUserSnapshot]);
  const [sessionUser, setSessionUser] = useState<AuthUser | null | undefined>(undefined);
  const authUser = sessionUser !== undefined ? sessionUser : storedUser;

  const [tab, setTab] = useState<Tab>("explore");
  const [start, setStart] = useState<LatLng | null>(DEFAULT_START);
  const [end, setEnd] = useState<LatLng | null>(DEFAULT_END);
  const [startLabel, setStartLabel] = useState(DEFAULT_START_LABEL);
  const [endLabel, setEndLabel] = useState(DEFAULT_END_LABEL);

  const [reportPoint, setReportPoint] = useState<LatLng | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [bumps, setBumps] = useState<Bump[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routeState, setRouteState] = useState("Ready to compare routes");
  const [severity, setSeverity] = useState<Severity>("bumpy");
  const [roadLabel, setRoadLabel] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [riding, setRiding] = useState(false);
  const [rideStats, setRideStats] = useState({ signals: 0, speed: 0, elapsed: 0 });

  // Stitch Interactive Viewport States
  const [is3D, setIs3D] = useState(false);
  const [showRadar, setShowRadar] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [routeMode, setRouteMode] = useState<"comfort" | "fast" | "twowheeler">("comfort");
  const mapInstanceRef = useRef<L.Map | null>(null);

  const watchRef = useRef<number | null>(null);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const latestPositionRef = useRef<GeolocationPosition | null>(null);
  const lastBumpRef = useRef(0);
  const rideStartRef = useRef(0);
  const sessionRef = useRef("");
  const ignoreMapClicksUntilRef = useRef(0);

  function handleLoginSuccess(user: AuthUser) {
    // The map mounts under the pointer that activated Guest mode. Ignore that
    // finishing gesture so it cannot replace the default route endpoints.
    ignoreMapClicksUntilRef.current = Date.now() + 500;
    try {
      localStorage.setItem("nsr_user_session", JSON.stringify(user));
    } catch {}
    setSessionUser(user);
  }

  function handleLogout() {
    try {
      localStorage.removeItem("nsr_user_session");
    } catch {}
    setSessionUser(null);
  }

  const refreshData = useCallback(async () => {
    const [reportResult, bumpResult] = await Promise.allSettled([
      fetch("/api/reports").then((response) => (response.ok ? response.json() : Promise.reject())),
      fetch("/api/bumps").then((response) => (response.ok ? response.json() : Promise.reject())),
    ]);
    if (reportResult.status === "fulfilled") setReports(reportResult.value.reports ?? []);
    if (bumpResult.status === "fulfilled") setBumps(bumpResult.value.bumps ?? []);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      const [reportResult, bumpResult] = await Promise.allSettled([
        fetch("/api/reports").then((response) => (response.ok ? response.json() : Promise.reject())),
        fetch("/api/bumps").then((response) => (response.ok ? response.json() : Promise.reject())),
      ]);
      if (!active) return;
      if (reportResult.status === "fulfilled") setReports(reportResult.value.reports ?? []);
      if (bumpResult.status === "fulfilled") setBumps(bumpResult.value.bumps ?? []);
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!riding) return;
    const timer = window.setInterval(
      () =>
        setRideStats((stats) => ({
          ...stats,
          elapsed: Math.floor((Date.now() - rideStartRef.current) / 1000),
        })),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [riding]);

  const handleMapPoint = useCallback(
    (point: LatLng) => {
      if (Date.now() < ignoreMapClicksUntilRef.current) return;
      if (!insideBounds(point)) {
        setNotice("That point is outside Bangalore Urban or Bangalore Rural district.");
        return;
      }
      setNotice("");
      const locName = findClosestLocation(point);

      if (tab === "report") {
        setReportPoint(point);
        if (!roadLabel) {
          setRoadLabel(locName);
        }
        return;
      }

      if (!start || (start && end)) {
        setStart(point);
        setStartLabel(locName);
        setEnd(null);
        setEndLabel("");
        setRoutes([]);
        setRouteState("Now select or type a destination");
      } else {
        setEnd(point);
        setEndLabel(locName);
        setRouteState("Ready to compare routes");
      }
    },
    [tab, start, end, roadLabel],
  );

  function handleSwapLocations() {
    const prevStart = start;
    const prevStartLabel = startLabel;
    setStart(end);
    setStartLabel(endLabel);
    setEnd(prevStart);
    setEndLabel(prevStartLabel);
    setRoutes([]);
  }

  async function compareRoutes() {
    if (!start || !end) return;
    setRouteState("Finding open-data route alternatives…");
    setRoutes([]);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?alternatives=true&overview=full&geometries=geojson&steps=false`;
      const data = await fetch(url).then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      });
      const scored = (data.routes ?? []).map(
        (route: { geometry: { coordinates: [number, number][] }; duration: number; distance: number }) =>
          scoreRoute(
            { geometry: route.geometry, duration: route.duration, distance: route.distance },
            reports,
            bumps,
          ),
      );
      scored.sort((a: RouteOption, b: RouteOption) => b.score - a.score || a.duration - b.duration);
      setRoutes(scored);
      setRouteState(
        scored.length
          ? `${scored.length} route${scored.length === 1 ? "" : "s"} compared across Bangalore districts`
          : "No route found",
      );
    } catch {
      setRouteState("The community OSRM router is temporarily unavailable. Try again shortly.");
    }
  }

  function handleLocateCurrentPosition(target: "start" | "report") {
    if (!navigator.geolocation) {
      setNotice("Location is not supported in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!insideBounds(point)) {
          setNotice("Your current GPS location is outside Bangalore Urban or Bangalore Rural district.");
          return;
        }
        const name = "My Current Location";
        if (target === "report") {
          setReportPoint(point);
          if (!roadLabel) setRoadLabel("Current Location");
        } else {
          setStart(point);
          setStartLabel(name);
          setRoutes([]);
        }
        setNotice("");
      },
      () => setNotice("Location permission was not granted."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!reportPoint) {
      setNotice("Please select a road from the dropdown, tap the map, or use your GPS.");
      return;
    }
    const finalRoadLabel = roadLabel.trim() || "Reported Bangalore Road";
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        latitude: reportPoint.lat,
        longitude: reportPoint.lng,
        severity,
        roadLabel: finalRoadLabel,
        note,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setNotice(result.error ?? "Unable to submit the report");
      return;
    }
    setReports((items) => [result.report, ...items]);
    setRoadLabel("");
    setNote("");
    setReportPoint(null);
    setNotice("Road condition report added anonymously. Thank you for contributing.");
  }

  function handleSelectRoadForReport(road: BangaloreRoad) {
    setRoadLabel(road.name);
    if (!reportPoint) {
      setReportPoint({ lat: road.lat, lng: road.lng });
      setNotice(`Pinned to ${road.name}. Tap on map to refine exact spot if desired.`);
    }
  }

  async function startRide() {
    if (!navigator.geolocation || typeof DeviceMotionEvent === "undefined") {
      setNotice("This browser does not expose the required location and motion sensors.");
      return;
    }
    try {
      const constructor = DeviceMotionEvent as unknown as MotionEventConstructor;
      if (
        typeof constructor.requestPermission === "function" &&
        (await constructor.requestPermission()) !== "granted"
      ) {
        throw new Error("Motion permission was not granted");
      }
      sessionRef.current = crypto.randomUUID();
      rideStartRef.current = Date.now();
      setRideStats({ signals: 0, speed: 0, elapsed: 0 });

      watchRef.current = navigator.geolocation.watchPosition(
        (position) => {
          latestPositionRef.current = position;
          setRideStats((stats) => ({
            ...stats,
            speed: Math.max(0, (position.coords.speed ?? 0) * 3.6),
          }));
        },
        () => setNotice("Keep precise location enabled while recording."),
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
      );

      const handler = async (event: DeviceMotionEvent) => {
        const a = event.acceleration;
        const gravity = event.accelerationIncludingGravity;
        const intensity =
          a && [a.x, a.y, a.z].every((value) => value !== null)
            ? Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2)
            : gravity
            ? Math.abs(
                Math.sqrt(
                  (gravity.x ?? 0) ** 2 + (gravity.y ?? 0) ** 2 + (gravity.z ?? 0) ** 2,
                ) - 9.81,
              )
            : 0;

        const position = latestPositionRef.current;
        if (intensity < 2.8 || !position || Date.now() - lastBumpRef.current < 2500) return;
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!insideBounds(point) || position.coords.accuracy > 80) return;

        lastBumpRef.current = Date.now();
        const payload = {
          latitude: Number(point.lat.toFixed(5)),
          longitude: Number(point.lng.toFixed(5)),
          intensity: Number(intensity.toFixed(2)),
          speedKph: Number(Math.max(0, (position.coords.speed ?? 0) * 3.6).toFixed(1)),
          accuracyM: Number(position.coords.accuracy.toFixed(1)),
          sessionId: sessionRef.current,
        };
        setRideStats((stats) => ({ ...stats, signals: stats.signals + 1 }));
        await fetch("/api/bumps", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ events: [payload] }),
        }).catch(() => undefined);
      };

      motionHandlerRef.current = handler;
      window.addEventListener("devicemotion", handler);
      setRiding(true);
      setNotice("Ride recording started across Bangalore. Keep this page open.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to start ride recording");
    }
  }

  async function stopRide() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (motionHandlerRef.current) window.removeEventListener("devicemotion", motionHandlerRef.current);
    watchRef.current = null;
    motionHandlerRef.current = null;
    latestPositionRef.current = null;
    setRiding(false);
    setNotice("Ride saved anonymously. Detected bump events uploaded.");
    await refreshData();
  }

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (motionHandlerRef.current) window.removeEventListener("devicemotion", motionHandlerRef.current);
  }, []);

  const fastest = useMemo(
    () => (routes.length ? [...routes].sort((a, b) => a.duration - b.duration)[0] : null),
    [routes],
  );
  const smoothest = routes[0] ?? null;
  const severeCount = reports.filter((report) => report.severity === "not_drivable").length;

  if (!authUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="relative min-h-screen bg-background text-on-surface antialiased flex flex-col">
      {/* -------------------------------------------------------------------- */}
      {/* 1. GOOGLE STITCH TOPBAR                                               */}
      {/* -------------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface-container-lowest/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.36)] border-b border-outline-variant/30 flex items-center px-4 sm:px-6 justify-between gap-3">
        {/* Left: Mobile Toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-[0_0_16px_rgba(48,209,88,0.4)]">
              <Bike size={18} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-title-section text-title-section font-bold tracking-tight text-on-surface">
                Namma Smooth Roads
              </span>
              <span className="hidden sm:inline font-label-eyebrow text-label-eyebrow uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-primary tracking-widest font-semibold">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search & Quick Route Pills */}
        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center h-9 px-3 rounded-xl bg-surface-container/70 border border-outline-variant/30 text-xs text-outline w-64 shadow-inner">
            <Search size={14} className="mr-2 text-outline" />
            <input
              type="text"
              className="bg-transparent border-0 outline-none w-full text-on-surface placeholder:text-outline text-xs"
              placeholder="Search coordinates, roads..."
              value={roadLabel}
              onChange={(e) => setRoadLabel(e.target.value)}
            />
            <span className="font-code-telemetry text-[10px] px-1 rounded bg-surface-container-highest text-outline">
              ⌘K
            </span>
          </div>

          <div className="flex items-center p-0.5 rounded-full bg-surface-container border border-outline-variant/30 text-xs">
            <button
              type="button"
              className={`px-3 py-1 rounded-full font-ui-action transition-all ${
                tab === "explore"
                  ? "bg-surface-bright text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.24)] font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setTab("explore")}
            >
              Smoothest
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full font-ui-action transition-all ${
                tab === "report"
                  ? "bg-surface-bright text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.24)] font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setTab("report")}
            >
              Reports
            </button>
            <button
              type="button"
              className={`px-3 py-1 rounded-full font-ui-action transition-all ${
                tab === "ride"
                  ? "bg-surface-bright text-on-surface shadow-[0_2px_8px_rgba(0,0,0,0.24)] font-semibold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
              onClick={() => setTab("ride")}
            >
              Telemetry
            </button>
          </div>
        </div>

        {/* Right Action Cluster: GNSS status, Theme Switcher, User */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low border border-outline-variant/30 font-code-telemetry text-xs text-primary shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>GNSS Dual-Band: Bangalore Mesh</span>
          </div>

          <ThemeSwitcher compact />

          <div className="flex items-center gap-2 pl-1 border-l border-outline-variant/30">
            <div className={`px-2.5 py-1 rounded-full font-caption-meta text-xs font-semibold flex items-center gap-1.5 ${
              authUser.role === "guest"
                ? "bg-primary-container/20 text-primary border border-primary/30"
                : "bg-secondary-container/20 text-secondary border border-secondary/30"
            }`}>
              {authUser.role === "guest" ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
              <span className="hidden sm:inline">{authUser.name}</span>
            </div>

            <button
              type="button"
              className="p-1.5 rounded-full text-outline hover:text-error hover:bg-error-container/20 transition-colors"
              onClick={handleLogout}
              title="Logout session"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------------- */}
      {/* 2. GOOGLE STITCH LEFT SPATIAL NAVIGATION SIDEBAR                      */}
      {/* -------------------------------------------------------------------- */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-surface-container-lowest/85 backdrop-blur-2xl border-r border-outline-variant/30 z-40 flex flex-col justify-between py-4 transition-transform duration-200 lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="px-3">
          <div className="px-3 mb-3">
            <span className="font-label-eyebrow text-label-eyebrow uppercase text-outline tracking-wider">
              Spatial Navigation
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {[
              { id: "explore", label: "Explore & Routes", icon: RouteIcon },
              { id: "report", label: "Road Reports", icon: MapPin },
              { id: "ride", label: "Live Telemetry & Ride", icon: Radio },
              { id: "ops", label: "District Analytics", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setTab(id as Tab);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left font-body-medium text-body-medium ${
                    active
                      ? "bg-primary-container text-on-primary-container font-ui-action shadow-[0_2px_12px_rgba(48,209,88,0.3)]"
                      : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Telemetry Card in Sidebar */}
        <div className="px-3">
          <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/30 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-label-eyebrow text-label-eyebrow uppercase text-outline">
                Stream Latency
              </span>
              <span className="font-code-telemetry text-code-telemetry text-primary font-bold">
                14ms
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full w-4/5 rounded-full bg-primary" />
            </div>
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-caption-meta text-caption-meta text-outline">
                Spatial Mesh 120Hz
              </span>
              <span className="font-code-telemetry text-code-telemetry text-secondary">
                60 FPS
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* -------------------------------------------------------------------- */}
      {/* 3. MAIN WORKSPACE: FULL CANVAS MAP + FLOATING INSPECTOR + HUDS        */}
      {/* -------------------------------------------------------------------- */}
      <div className="lg:pl-64 flex-1 flex flex-col pt-16">
        <main className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-surface-container-lowest">
          {/* Full Interactive Canvas Map */}
          <AppMap
            tab={tab}
            start={start}
            end={end}
            reportPoint={reportPoint}
            reports={reports}
            bumps={bumps}
            routes={routes}
            onMapPoint={handleMapPoint}
            is3D={is3D}
            showRadar={showRadar}
            onMouseMoveCoords={(lat, lng) => setCurrentCoords({ lat, lng })}
            mapInstanceRef={mapInstanceRef}
          />

          {/* TOP-LEFT: Floating Route Inspector / Report / Ride / Operations Drawer */}
          <div className="absolute top-4 left-4 z-30 w-[92%] sm:w-[410px] max-h-[calc(100vh-6rem)] overflow-y-auto pointer-events-auto">
            <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-low/90 backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.5)] border border-outline-variant/40 flex flex-col gap-4">
              {/* TAB 1: EXPLORE & ROUTES */}
              {tab === "explore" && (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RouteIcon size={18} className="text-primary" />
                      <span className="font-title-section text-title-section font-bold text-on-surface">
                        Route Inspector
                      </span>
                    </div>
                    <span className="font-label-eyebrow text-label-eyebrow uppercase px-2 py-0.5 rounded bg-primary-container/20 text-primary">
                      Dynamic Path
                    </span>
                  </div>

                  {/* Mode switcher segmented control */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-container-lowest/70 border border-outline-variant/30 text-xs">
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                        routeMode === "comfort"
                          ? "bg-surface-bright text-on-surface shadow-sm font-semibold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      onClick={() => setRouteMode("comfort")}
                    >
                      <Zap size={13} className="text-primary" />
                      <span>Comfort</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                        routeMode === "fast"
                          ? "bg-surface-bright text-on-surface shadow-sm font-semibold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      onClick={() => setRouteMode("fast")}
                    >
                      <RouteIcon size={13} className="text-secondary" />
                      <span>Fastest</span>
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg transition-all ${
                        routeMode === "twowheeler"
                          ? "bg-surface-bright text-on-surface shadow-sm font-semibold"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                      onClick={() => setRouteMode("twowheeler")}
                    >
                      <Bike size={13} className="text-tertiary" />
                      <span>Two-Wheeler</span>
                    </button>
                  </div>

                  {/* Start & Destination Form Stack with Connector Line */}
                  <div className="flex flex-col gap-2 relative">
                    <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-outline-variant/50 pointer-events-none" />

                    <div className="relative z-10">
                      <LocationSearchInput
                        label="Start Point"
                        placeholder="Type start (Majestic, Indiranagar)..."
                        selectedPoint={start}
                        selectedLabel={startLabel}
                        onSelect={(loc) => {
                          setStart({ lat: loc.lat, lng: loc.lng });
                          setStartLabel(loc.name);
                          setRoutes([]);
                          setRouteState(end ? "Ready to compare routes" : "Now select destination");
                        }}
                        onClear={() => {
                          setStart(null);
                          setStartLabel("");
                          setRoutes([]);
                        }}
                        onUseMyLocation={() => handleLocateCurrentPosition("start")}
                        iconType="start"
                      />
                    </div>

                    <div className="flex items-center justify-between px-2 py-0.5 relative z-10">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs text-outline hover:text-primary transition-colors font-code-telemetry ml-6"
                        onClick={handleSwapLocations}
                        title="Swap Origin & Destination"
                      >
                        <ArrowUpDown size={12} />
                        <span>Swap Origin & Destination</span>
                      </button>
                    </div>

                    <div className="relative z-10">
                      <LocationSearchInput
                        label="Destination"
                        placeholder="Type destination (Whitefield, Airport)..."
                        selectedPoint={end}
                        selectedLabel={endLabel}
                        onSelect={(loc) => {
                          setEnd({ lat: loc.lat, lng: loc.lng });
                          setEndLabel(loc.name);
                          setRoutes([]);
                          setRouteState(start ? "Ready to compare routes" : "Now select start point");
                        }}
                        onClear={() => {
                          setEnd(null);
                          setEndLabel("");
                          setRoutes([]);
                        }}
                        iconType="end"
                      />
                    </div>
                  </div>

                  {/* Action CTA */}
                  <button
                    type="button"
                    className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-ui-action text-ui-action flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(48,209,88,0.35)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!start || !end}
                    onClick={compareRoutes}
                  >
                    <Navigation2 size={16} />
                    <span>Compare smoothest & fastest</span>
                  </button>

                  <p className="font-code-telemetry text-code-telemetry text-outline text-center">
                    {routeState}
                  </p>

                  {/* Route Results Cards */}
                  {smoothest && (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="p-3 rounded-xl bg-surface-container-high/90 border border-primary/40 shadow-md flex items-center justify-between cursor-pointer hover:border-primary transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(85,238,113,0.8)]" />
                          <div>
                            <div className="font-title-section text-title-section text-on-surface flex items-center gap-1.5 font-bold">
                              <span>{fastest === smoothest ? "Smoothest + fastest" : "Smoothest"}</span>
                              <span className="font-label-eyebrow text-label-eyebrow px-1.5 rounded bg-primary-container/20 text-primary">
                                Optimal
                              </span>
                            </div>
                            <div className="font-caption-meta text-caption-meta text-outline">
                              {(smoothest.distance / 1000).toFixed(1)} km · comfort {smoothest.score}/100
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-headline-kpi text-[18px] text-primary">
                            {formatDuration(smoothest.duration)}
                          </div>
                          <div className="font-code-telemetry text-[11px] text-outline">
                            {smoothest.observations ? `${smoothest.observations} obs` : "No road penalty"}
                          </div>
                        </div>
                      </div>

                      {fastest && fastest !== smoothest && (
                        <div className="p-3 rounded-xl bg-surface-container/60 border border-outline-variant/40 flex items-center justify-between cursor-pointer hover:bg-surface-container-high/60 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(163,201,255,0.8)]" />
                            <div>
                              <div className="font-title-section text-title-section text-on-surface font-semibold">
                                Fastest Alternative
                              </div>
                              <div className="font-caption-meta text-caption-meta text-outline">
                                {(fastest.distance / 1000).toFixed(1)} km · comfort {fastest.score}/100
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-headline-kpi text-[18px] text-secondary">
                              {formatDuration(fastest.duration)}
                            </div>
                            <div className="font-code-telemetry text-[11px] text-primary">
                              -{Math.round((smoothest.duration - fastest.duration) / 60)}m faster
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container/40 border border-outline-variant/30 text-xs text-outline">
                    <Info size={14} className="flex-shrink-0 mt-0.5 text-secondary" />
                    <span>
                      Expanded across Bengaluru Urban & Rural districts. Uses OpenStreetMap and OSRM.
                    </span>
                  </div>
                </>
              )}

              {/* TAB 2: ROAD CONDITION REPORT */}
              {tab === "report" && (
                <form onSubmit={submitReport} className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-tertiary-container" />
                      <span className="font-title-section text-title-section font-bold text-on-surface">
                        Road Condition Report
                      </span>
                    </div>
                    <span className="font-label-eyebrow text-label-eyebrow uppercase px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary-container">
                      Community Pin
                    </span>
                  </div>

                  <div>
                    <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase block mb-1">
                      Search Road Name
                    </label>
                    <RoadSearchInput
                      value={roadLabel}
                      onChange={setRoadLabel}
                      onSelectRoad={handleSelectRoadForReport}
                      placeholder="Search (Outer Ring Road, NH 44, SH 9)..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 rounded-xl border border-outline-variant/50 bg-surface-container hover:bg-surface-container-high font-ui-action text-xs text-on-surface flex items-center justify-center gap-1.5 transition-colors"
                      onClick={() => handleLocateCurrentPosition("report")}
                    >
                      <LocateFixed size={14} className="text-primary" />
                      <span>Use Current GPS</span>
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl bg-surface-container/60 border border-outline-variant/40 font-code-telemetry text-xs text-center text-outline">
                    {reportPoint
                      ? `Pinned: ${reportPoint.lat.toFixed(5)}° N, ${reportPoint.lng.toFixed(5)}° E`
                      : "Search road above or tap map to pin coordinates"}
                  </div>

                  {/* Severity selection */}
                  <div>
                    <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase block mb-1.5">
                      Road Condition Severity
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(severityMeta) as Severity[]).map((value) => {
                        const isChosen = severity === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs ${
                              isChosen
                                ? "bg-surface-container-high border-primary text-on-surface shadow-sm font-semibold"
                                : "bg-surface-container/50 border-outline-variant/40 text-outline hover:text-on-surface"
                            }`}
                            onClick={() => setSeverity(value)}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: severityMeta[value].color }}
                            />
                            <span>{severityMeta[value].label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="font-label-eyebrow text-label-eyebrow text-outline uppercase block mb-1">
                      Short Observation Note <span className="lowercase font-normal">(optional)</span>
                    </label>
                    <textarea
                      className="w-full p-2.5 rounded-xl bg-surface-container/80 border border-outline-variant/50 text-on-surface font-body-subtle text-xs placeholder:text-outline outline-none focus:border-primary resize-none"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={240}
                      placeholder="e.g. Broken asphalt left lane near junction..."
                      rows={2}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-ui-action text-ui-action flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(48,209,88,0.35)] hover:brightness-105 active:scale-[0.98] transition-all"
                  >
                    <Send size={15} />
                    <span>Submit Road Report</span>
                  </button>
                </form>
              )}

              {/* TAB 3: LIVE TELEMETRY & RIDE */}
              {tab === "ride" && (
                <div className="flex flex-col gap-4 text-center">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio size={18} className="text-primary" />
                      <span className="font-title-section text-title-section font-bold text-on-surface">
                        Foreground Motion Sensing
                      </span>
                    </div>
                    <span className={`font-label-eyebrow text-label-eyebrow uppercase px-2 py-0.5 rounded ${
                      riding ? "bg-error-container/20 text-error animate-pulse" : "bg-surface-container text-outline"
                    }`}>
                      {riding ? "Live Stream" : "Standby"}
                    </span>
                  </div>

                  {/* Pulsing Sensing Orb */}
                  <div className="relative w-36 h-36 mx-auto my-2 flex items-center justify-center">
                    <div className={`absolute inset-0 rounded-full ${
                      riding ? "bg-error/20 animate-ping" : "bg-primary-container/10"
                    }`} />
                    <div className={`w-28 h-28 rounded-full border-2 flex flex-col items-center justify-center shadow-lg transition-all ${
                      riding
                        ? "bg-surface-container-high border-error text-error shadow-error/20"
                        : "bg-surface-container border-primary/50 text-primary shadow-primary/20"
                    }`}>
                      <Bike size={26} />
                      <span className="font-title-section text-xs font-bold mt-1">
                        {riding ? "STREAMING" : "READY"}
                      </span>
                      <span className="font-caption-meta text-[9px] text-outline">
                        {riding ? "Vibration Active" : "Mount Phone"}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Signals</span>
                      <span className="font-headline-kpi text-[20px] text-on-surface">{rideStats.signals}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Speed</span>
                      <span className="font-headline-kpi text-[20px] text-primary">{rideStats.speed.toFixed(0)} <small className="text-[10px]">km/h</small></span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Time</span>
                      <span className="font-code-telemetry text-[16px] text-on-surface font-bold">
                        {Math.floor(rideStats.elapsed / 60)}:{String(rideStats.elapsed % 60).padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  {!riding ? (
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-ui-action text-ui-action flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(48,209,88,0.35)] hover:brightness-105 active:scale-[0.98] transition-all"
                      onClick={startRide}
                    >
                      <Radio size={16} />
                      <span>Start Ride Recording</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-error text-on-error font-ui-action text-ui-action flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,69,58,0.4)] hover:brightness-105 active:scale-[0.98] transition-all"
                      onClick={stopRide}
                    >
                      <CircleStop size={16} />
                      <span>Stop and Save Ride</span>
                    </button>
                  )}

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-tertiary-container/15 border border-tertiary/20 text-xs text-tertiary text-left">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>Mount phone securely before moving. Never interact with screen while riding.</span>
                  </div>
                </div>
              )}

              {/* TAB 4: DISTRICT ANALYTICS */}
              {tab === "ops" && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 size={18} className="text-secondary" />
                      <span className="font-title-section text-title-section font-bold text-on-surface">
                        District Operations Pulse
                      </span>
                    </div>
                    <span className="font-label-eyebrow text-label-eyebrow uppercase px-2 py-0.5 rounded bg-secondary-container/20 text-secondary">
                      Live Telemetry
                    </span>
                  </div>

                  {/* 4 Metric KPI Widgets */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Reports</span>
                      <strong className="font-headline-kpi text-[22px] text-on-surface block mt-1">{reports.length}</strong>
                      <small className="font-caption-meta text-outline text-[10px]">community</small>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Ride Signals</span>
                      <strong className="font-headline-kpi text-[22px] text-primary block mt-1">{bumps.length}</strong>
                      <small className="font-caption-meta text-outline text-[10px]">motion events</small>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Not Drivable</span>
                      <strong className="font-headline-kpi text-[22px] text-error block mt-1">{severeCount}</strong>
                      <small className="font-caption-meta text-outline text-[10px]">critical alerts</small>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-container/70 border border-outline-variant/40">
                      <span className="font-label-eyebrow text-[10px] text-outline block">Coverage</span>
                      <strong className="font-headline-kpi text-[20px] text-secondary block mt-1">Urban & Rural</strong>
                      <small className="font-caption-meta text-outline text-[10px]">district bounds</small>
                    </div>
                  </div>

                  <div>
                    <span className="font-label-eyebrow text-label-eyebrow text-outline uppercase block mb-2">
                      Recent Condition Reports
                    </span>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                      {reports.slice(0, 5).map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-surface-container/50 border border-outline-variant/30 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: severityMeta[r.severity].color }}
                            />
                            <div className="truncate">
                              <span className="font-semibold text-on-surface block truncate">{r.roadLabel}</span>
                              <span className="text-[10px] text-outline block">{severityMeta[r.severity].label}</span>
                            </div>
                          </div>
                          <span className="font-code-telemetry text-[10px] text-outline flex-shrink-0 ml-2">
                            {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      ))}
                      {!reports.length && (
                        <div className="p-4 rounded-xl border border-dashed border-outline-variant/40 text-center text-xs text-outline">
                          No community reports yet.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-container/40 border border-outline-variant/30 text-xs text-outline">
                    <Gauge size={14} className="flex-shrink-0 mt-0.5 text-primary" />
                    <span>
                      Vibration spikes and reports update route scores in real-time.
                    </span>
                  </div>
                </div>
              )}

              {/* Status Toast Notification */}
              {notice && (
                <div className="p-2.5 rounded-xl bg-primary-container/20 border border-primary/30 text-primary font-body-subtle text-xs text-center animate-fade-in">
                  {notice}
                </div>
              )}
            </div>
          </div>

          {/* TOP-RIGHT: Adaptive Map Control Stack & Layers */}
          <div className="absolute top-4 right-4 z-30 hidden sm:flex flex-col gap-2 items-end pointer-events-auto">
            {/* North Reset & 3D Pitch View Toggle */}
            <div className="p-1 rounded-2xl bg-surface-container-low/85 backdrop-blur-2xl border border-outline-variant/40 shadow-xl flex flex-col gap-1">
              <button
                type="button"
                className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-on-surface hover:text-primary transition-all"
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([12.9767, 77.5713], 12);
                  }
                }}
                title="Align to Bangalore North"
              >
                <Compass size={18} className="text-tertiary-container" />
              </button>
              <button
                type="button"
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-code-telemetry text-[12px] font-bold transition-all ${
                  is3D
                    ? "bg-primary-container text-on-primary-container shadow-sm"
                    : "bg-surface-container text-primary hover:bg-surface-container-high"
                }`}
                onClick={() => setIs3D((prev) => !prev)}
                title="Toggle 3D Pitch View"
              >
                3D
              </button>
            </div>

            {/* Weather / Radar Layer Toggle */}
            <div className="p-1 rounded-2xl bg-surface-container-low/85 backdrop-blur-2xl border border-outline-variant/40 shadow-xl flex flex-col gap-1">
              <button
                type="button"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  showRadar
                    ? "bg-secondary-container text-on-secondary-container"
                    : "bg-surface-container text-secondary hover:bg-surface-container-high"
                }`}
                onClick={() => setShowRadar((prev) => !prev)}
                title="Toggle Live Radar Overlay"
              >
                <Layers size={17} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="p-1 rounded-2xl bg-surface-container-low/85 backdrop-blur-2xl border border-outline-variant/40 shadow-xl flex flex-col items-center gap-1">
              <button
                type="button"
                className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-all"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <div className="w-1 h-8 bg-surface-container-highest rounded-full relative my-0.5">
                <div className="w-full h-1/2 bg-primary rounded-full" />
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container-high flex items-center justify-center transition-all"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
            </div>

            {/* Monospace Spatial Coordinates HUD */}
            <div className="px-3 py-1.5 rounded-xl bg-surface-container-lowest/85 backdrop-blur-md border border-outline-variant/30 shadow-lg flex items-center gap-2 text-outline font-code-telemetry text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span>
                {currentCoords.lat.toFixed(4)}° N, {currentCoords.lng.toFixed(4)}° E
              </span>
            </div>
          </div>

          {/* BOTTOM-CENTER: Dynamic Maneuver / Guidance HUD Bar (Visible when route or riding) */}
          {(smoothest || riding) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-[800px] pointer-events-auto">
              <div className="p-3.5 sm:px-5 rounded-3xl bg-surface-container-lowest/90 backdrop-blur-3xl border border-outline-variant/40 shadow-[0_24px_60px_rgba(0,0,0,0.65)] flex flex-wrap items-center justify-between gap-4">
                {/* Left: Next Turn Guidance */}
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary-container text-on-primary-container shadow-[0_4px_16px_rgba(48,209,88,0.4)] flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Navigation2 size={20} className="transform rotate-45" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-kpi text-[17px] text-on-surface tracking-tight font-bold">
                        {riding ? "Live Ride Active" : "Smoothest Guidance"}
                      </span>
                      <span className="font-caption-meta text-caption-meta text-primary font-semibold">
                        Optimal
                      </span>
                    </div>
                    <div className="font-body-subtle text-body-subtle text-outline truncate max-w-[240px]">
                      {riding ? "Recording accelerometer vibrations" : (endLabel || "Selected destination")}
                    </div>
                  </div>
                </div>

                {/* Center: Journey Progress & ETA */}
                {smoothest && (
                  <div className="hidden sm:flex items-center gap-5 px-4 border-l border-r border-outline-variant/30">
                    <div className="flex flex-col">
                      <span className="font-label-eyebrow text-label-eyebrow uppercase text-outline">
                        Arrival Time
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-headline-kpi text-[18px] text-on-surface font-bold">
                          {formatDuration(smoothest.duration)}
                        </span>
                      </div>
                      <span className="font-code-telemetry text-code-telemetry text-primary">
                        {(smoothest.distance / 1000).toFixed(1)} km
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="font-label-eyebrow text-label-eyebrow uppercase text-outline">
                        Comfort
                      </span>
                      <span className="font-headline-kpi text-[18px] text-primary font-bold">
                        {smoothest.score}/100
                      </span>
                      <span className="font-code-telemetry text-code-telemetry text-outline">
                        {smoothest.observations} obs
                      </span>
                    </div>
                  </div>
                )}

                {/* Right: Telemetry & Circular Gauge */}
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-headline-kpi text-[18px] text-on-surface font-bold">
                        {rideStats.speed.toFixed(0)}
                      </span>
                      <span className="font-caption-meta text-caption-meta text-outline">km/h</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-[9px] font-code-telemetry text-outline font-bold">
                      SPEED
                    </span>
                  </div>

                  {/* Circular Comfort Ring Gauge */}
                  <div className="relative w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-surface-container-high"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      />
                      <path
                        className="text-primary"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${smoothest ? smoothest.score : 85}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <span className="absolute font-code-telemetry text-[10px] font-bold text-on-surface">
                      {smoothest ? `${smoothest.score}%` : "85%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

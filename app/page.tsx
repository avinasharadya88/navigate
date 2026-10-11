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
  Gauge,
  Info,
  LocateFixed,
  LogOut,
  MapPin,
  Radio,
  Route as RouteIcon,
  Send,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { isInsideBangalore } from "../lib/bangalore-bounds";
import { BANGALORE_LOCATIONS, type BangaloreRoad } from "../lib/bangalore-data";
import { LocationSearchInput } from "../components/location-search-input";
import { RoadSearchInput } from "../components/road-search-input";
import { LoginView, type AuthUser } from "../components/login-view";

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
  rough: { label: "Rough", color: "#d89a2b", penalty: 8 },
  bumpy: { label: "Bumpy", color: "#df6f2d", penalty: 15 },
  not_drivable: { label: "Not drivable", color: "#d94b52", penalty: 35 },
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

function AppMap({
  tab,
  start,
  end,
  reportPoint,
  reports,
  bumps,
  routes,
  onMapPoint,
}: {
  tab: Tab;
  start: LatLng | null;
  end: LatLng | null;
  reportPoint: LatLng | null;
  reports: Report[];
  bumps: Bump[];
  routes: RouteOption[];
  onMapPoint: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const leafletRef = useRef<typeof L | null>(null);
  const callbackRef = useRef(onMapPoint);

  useEffect(() => {
    callbackRef.current = onMapPoint;
  }, [onMapPoint]);

  useEffect(() => {
    let cancelled = false;
    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
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
                color: "#246e5a",
                weight: 2.5,
                fillColor: "#54a98b",
                fillOpacity: 0.08,
              };
            }
            if (props?.category === "rural") {
              return {
                color: "#40798c",
                weight: 2,
                fillColor: "#70a9a1",
                fillOpacity: 0.05,
                dashArray: "6 5",
              };
            }
            return {
              color: "#173f38",
              weight: 1.5,
              fillOpacity: 0,
              dashArray: "3 4",
            };
          },
          onEachFeature: (feature: Feature, layer: L.Layer) => {
            const props = feature?.properties as Record<string, unknown> | undefined;
            if (props?.name) {
              const taluks = Array.isArray(props.taluks) ? props.taluks.join(", ") : "";
              const talukText = taluks ? `<br><small style="color:#64736f">Taluks: ${taluks}</small>` : "";
              layer.bindTooltip(`<strong>${String(props.name)}</strong>${talukText}`, {
                sticky: true,
              });
            }
          },
        }).addTo(map);

        map.fitBounds(boundaryLayer.getBounds(), { padding: [24, 24] });
      } catch {
        // Fallback bounds for Bangalore Urban + Rural
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
    }
    mount();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

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
        weight: 3,
        fillColor: "#173f38",
        fillOpacity: 1,
      })
        .bindTooltip("Start Point")
        .addTo(group);
    }

    if (end) {
      L.circleMarker([end.lat, end.lng], {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#1d77d2",
        fillOpacity: 1,
      })
        .bindTooltip("Destination")
        .addTo(group);
    }

    if (reportPoint && tab === "report") {
      L.circleMarker([reportPoint.lat, reportPoint.lng], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#df6f2d",
        fillOpacity: 1,
      })
        .bindTooltip("Reported Location (Click map to change)")
        .addTo(group);
    }

    routes.forEach((route, index) => {
      L.polyline(
        route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        {
          color: index === 0 ? "#246e5a" : "#4b76c5",
          opacity: index === 0 ? 0.95 : 0.68,
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
          `<strong>${meta.label}</strong><br>${report.roadLabel}${
            report.note ? `<br>${report.note.replace(/[<>]/g, "")}` : ""
          }`,
        )
        .addTo(group);
    });

    bumps.forEach((bump) => {
      L.circle([bump.latitude, bump.longitude], {
        radius: Math.min(55, 14 + bump.intensity * 4),
        color: "#7b52a1",
        weight: 1,
        fillColor: "#9b70bf",
        fillOpacity: 0.2,
      })
        .bindTooltip(`Anonymous ride signal · ${bump.intensity.toFixed(1)} m/s²`)
        .addTo(group);
    });

    // Auto fit route if available
    if (routes.length > 0) {
      const poly = L.polyline(
        routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      );
      map.fitBounds(poly.getBounds(), { padding: [45, 45], maxZoom: 14 });
    }
  }, [start, end, reportPoint, reports, bumps, routes, tab]);

  return (
    <div className="map-wrap">
      <div
        ref={containerRef}
        className="map"
        aria-label="Interactive map of Bengaluru Urban and Bengaluru Rural Districts"
      />
      <div className="map-hint">
        <MapPin size={15} />
        {tab === "report"
          ? "Tap inside Bengaluru Urban or Rural to pin a road"
          : "Type location on left or tap map to set points"}
      </div>
      <div className="map-legend" aria-label="Road condition legend">
        <span><i className="legend-dot rough" /> Rough</span>
        <span><i className="legend-dot bumpy" /> Bumpy</span>
        <span><i className="legend-dot blocked" /> Not drivable</span>
        <span><i className="legend-ring" /> Ride signal</span>
      </div>
    </div>
  );
}

function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("nsr_user_session");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function subscribeUser(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export default function Home() {
  const storedUser = useSyncExternalStore(subscribeUser, getStoredUser, () => null);
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
  const [routeState, setRouteState] = useState("Select two points to compare routes");
  const [severity, setSeverity] = useState<Severity>("bumpy");
  const [roadLabel, setRoadLabel] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [riding, setRiding] = useState(false);
  const [rideStats, setRideStats] = useState({ signals: 0, speed: 0, elapsed: 0 });

  const watchRef = useRef<number | null>(null);
  const motionHandlerRef = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const latestPositionRef = useRef<GeolocationPosition | null>(null);
  const lastBumpRef = useRef(0);
  const rideStartRef = useRef(0);
  const sessionRef = useRef("");

  function handleLoginSuccess(user: AuthUser) {
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
    // Pin map coordinates to this road's representative center if no point set yet
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

  // Requirement 4: Show Login Page first until authenticated or continuing as guest!
  if (!authUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="Namma Smooth Roads home">
          <span className="brand-mark">
            <Bike size={21} />
          </span>
          <span>
            <strong>Namma Smooth Roads</strong>
            <small>Bengaluru Urban & Rural Districts</small>
          </span>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          {(
            [
              ["explore", "Explore", RouteIcon],
              ["report", "Report", MapPin],
              ["ride", "Ride", Radio],
              ["ops", "Operations", BarChart3],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              onClick={() => setTab(value)}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Topbar User Indicator and Logout button */}
        <div className="user-status-group">
          <div className={`user-chip ${authUser.role === "commuter" ? "commuter" : ""}`}>
            {authUser.role === "guest" ? <ShieldCheck size={14} /> : <UserCheck size={14} />}
            <span>{authUser.name} ({authUser.role === "guest" ? "Guest User" : "Commuter"})</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Switch User or return to Login">
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel">
          {tab === "explore" && (
            <>
              <div className="eyebrow">Two-wheeler route intelligence</div>
              <h1>Choose the ride your back will thank you for.</h1>
              <p className="lede">
                Type locations or tap anywhere across Bangalore Urban & Rural districts to compare travel time with road comfort.
              </p>

              {/* Requirement 1: Start point & Destination selected by typing */}
              <div className="field-stack">
                <LocationSearchInput
                  label="Start Point"
                  placeholder="Type start location (e.g. Majestic, Indiranagar, Nelamangala)..."
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

                <button
                  type="button"
                  className="swap-locations-btn"
                  onClick={handleSwapLocations}
                  title="Swap Start and Destination"
                >
                  <ArrowUpDown size={13} />
                  <span>Swap</span>
                </button>

                <LocationSearchInput
                  label="Destination"
                  placeholder="Type destination (e.g. Whitefield, Airport, Hosakote)..."
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

              <button
                className="primary-action"
                disabled={!start || !end}
                onClick={compareRoutes}
              >
                <RouteIcon size={18} /> Compare smoothest and fastest
              </button>
              <p className="status-line">{routeState}</p>

              {smoothest && (
                <div className="route-results">
                  <article className="route-card selected">
                    <div>
                      <span className="route-tag">
                        {fastest === smoothest ? "Smoothest + fastest" : "Smoothest"}
                      </span>
                      <strong>{formatDuration(smoothest.duration)}</strong>
                    </div>
                    <p>
                      {(smoothest.distance / 1000).toFixed(1)} km · comfort{" "}
                      {smoothest.score}/100
                    </p>
                    <small>
                      {smoothest.observations
                        ? `${smoothest.observations} nearby observations`
                        : "No nearby community reports yet"}
                    </small>
                  </article>
                  {fastest && fastest !== smoothest && (
                    <article className="route-card">
                      <div>
                        <span className="route-tag blue">Fastest</span>
                        <strong>{formatDuration(fastest.duration)}</strong>
                      </div>
                      <p>
                        {(fastest.distance / 1000).toFixed(1)} km · comfort{" "}
                        {fastest.score}/100
                      </p>
                      <small>
                        {Math.round((smoothest.duration - fastest.duration) / 60)} min faster
                      </small>
                    </article>
                  )}
                </div>
              )}

              <div className="data-note">
                <Info size={16} />
                <span>
                  Expanded across Bengaluru Urban and Rural districts. Routing uses community OSRM and OpenStreetMap.
                </span>
              </div>
            </>
          )}

          {tab === "report" && (
            <form onSubmit={submitReport}>
              <div className="eyebrow">Bangalore Road Report</div>
              <h1>Mark a road that needs attention.</h1>
              <p className="lede">
                Search the road name below using the interactive dropdown or tap on the map.
              </p>

              {/* Requirement 3: Search using road names with properly provided dropdown */}
              <div style={{ marginBottom: 14 }}>
                <label className="input-label" style={{ marginTop: 0 }}>
                  Search Road Name <span>interactive dropdown</span>
                </label>
                <RoadSearchInput
                  value={roadLabel}
                  onChange={setRoadLabel}
                  onSelectRoad={handleSelectRoadForReport}
                  placeholder="Search road (e.g. Outer Ring Road, Hosur Road, SH 9)..."
                />
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <button
                  type="button"
                  className="secondary-action"
                  style={{ marginTop: 0, flex: 1 }}
                  onClick={() => handleLocateCurrentPosition("report")}
                >
                  <LocateFixed size={16} /> GPS Location
                </button>
              </div>

              <div className="coordinate-box">
                {reportPoint
                  ? `Pinned: ${reportPoint.lat.toFixed(5)}, ${reportPoint.lng.toFixed(5)}`
                  : "Pick a road above or tap map to pin coordinates"}
              </div>

              <fieldset className="severity-picker">
                <legend>Road condition</legend>
                {(Object.keys(severityMeta) as Severity[]).map((value) => (
                  <label key={value} className={severity === value ? "chosen" : ""}>
                    <input
                      type="radio"
                      name="severity"
                      value={value}
                      checked={severity === value}
                      onChange={() => setSeverity(value)}
                    />
                    <i style={{ background: severityMeta[value].color }} />
                    {severityMeta[value].label}
                  </label>
                ))}
              </fieldset>

              <label className="input-label">
                Short note <span>optional</span>
              </label>
              <textarea
                className="text-input"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={240}
                placeholder="What should another rider know? (e.g. deep pothole on left lane)"
                rows={3}
              />

              <button className="primary-action" type="submit">
                <Send size={17} /> Submit Road Report
              </button>
            </form>
          )}

          {tab === "ride" && (
            <>
              <div className="eyebrow">Foreground motion sensing</div>
              <h1>Turn one ride into safer road knowledge.</h1>
              <p className="lede">
                Safari or Chrome must remain open. The prototype uploads detected bump events across Bangalore Urban & Rural districts.
              </p>
              <div className={`ride-orb ${riding ? "recording" : ""}`}>
                <Bike size={34} />
                <strong>{riding ? "Recording" : "Ready"}</strong>
                <span>{riding ? "Keep this page open" : "Mount your phone securely"}</span>
              </div>
              <div className="ride-stats">
                <div>
                  <span>Signals</span>
                  <strong>{rideStats.signals}</strong>
                </div>
                <div>
                  <span>Speed</span>
                  <strong>
                    {rideStats.speed.toFixed(0)} <small>km/h</small>
                  </strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>
                    {Math.floor(rideStats.elapsed / 60)}:
                    {String(rideStats.elapsed % 60).padStart(2, "0")}
                  </strong>
                </div>
              </div>
              {!riding ? (
                <button className="primary-action" onClick={startRide}>
                  <Radio size={18} /> Grant access and start ride
                </button>
              ) : (
                <button className="stop-action" onClick={stopRide}>
                  <CircleStop size={18} /> Stop and save ride
                </button>
              )}
              <div className="safety-note">
                <AlertTriangle size={17} />
                <span>Set this up before moving. Never interact with the screen while riding.</span>
              </div>
              <details className="privacy-details">
                <summary>What is collected?</summary>
                <p>
                  Timestamped bump intensity, rounded location in Bangalore Urban or Rural, GPS accuracy, and speed at the event.
                </p>
              </details>
            </>
          )}

          {tab === "ops" && (
            <>
              <div className="eyebrow">District operations view</div>
              <h1>Road condition pulse.</h1>
              <p className="lede">
                Evidence collected across official Bengaluru Urban and Bengaluru Rural districts.
              </p>
              <div className="metric-grid">
                <article>
                  <span>Reports</span>
                  <strong>{reports.length}</strong>
                  <small>community submitted</small>
                </article>
                <article>
                  <span>Ride signals</span>
                  <strong>{bumps.length}</strong>
                  <small>motion detected</small>
                </article>
                <article>
                  <span>Not drivable</span>
                  <strong>{severeCount}</strong>
                  <small>needs review</small>
                </article>
                <article>
                  <span>Coverage</span>
                  <strong>Urban & Rural</strong>
                  <small>district dataset</small>
                </article>
              </div>
              <h2 className="section-title">Recent reports</h2>
              <div className="activity-list">
                {reports.slice(0, 6).map((report) => (
                  <article key={report.id}>
                    <i style={{ background: severityMeta[report.severity].color }} />
                    <div>
                      <strong>{severityMeta[report.severity].label}</strong>
                      <span>{report.roadLabel}</span>
                    </div>
                    <time>
                      {new Date(report.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </article>
                ))}
                {!reports.length && (
                  <div className="empty-state">
                    No reports yet. The dashboard will update as observations arrive.
                  </div>
                )}
              </div>
              <div className="data-note">
                <Gauge size={16} />
                <span>
                  Low speeds alone never label a road as bad. Traffic, signals, stops, and surface evidence remain separate signals.
                </span>
              </div>
            </>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
        </aside>

        <div className="map-panel">
          <AppMap
            tab={tab}
            start={start}
            end={end}
            reportPoint={reportPoint}
            reports={reports}
            bumps={bumps}
            routes={routes}
            onMapPoint={handleMapPoint}
          />
          <div className="source-bar">
            <span>Boundary: Survey of India / KSRSAC, Bengaluru Urban & Rural Districts</span>
            <span>Basemap: OpenStreetMap</span>
            <span className="prototype-badge">Bengaluru Urban & Rural</span>
          </div>
        </div>
      </section>
    </main>
  );
}

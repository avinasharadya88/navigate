"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, BarChart3, Bike, CircleStop, Gauge, Info, LocateFixed, MapPin, Navigation, Radio, Route as RouteIcon, Send, ShieldCheck } from "lucide-react";
import { isInsideSouthZone } from "../lib/south-zone";

type LatLng = { lat: number; lng: number };
type Tab = "explore" | "report" | "ride" | "ops";
type Severity = "rough" | "bumpy" | "not_drivable";
type Report = { id: number; latitude: number; longitude: number; severity: Severity; roadLabel: string; note: string; createdAt: string };
type Bump = { id: number; latitude: number; longitude: number; intensity: number; speedKph: number | null; accuracyM: number | null; createdAt: string };
type RouteOption = { geometry: { coordinates: [number, number][] }; duration: number; distance: number; score: number; observations: number };

interface MotionEventConstructor { requestPermission?: () => Promise<"granted" | "denied"> }

const DEFAULT_START = { lat: 12.925, lng: 77.5838 };
const DEFAULT_END = { lat: 12.9166, lng: 77.5736 };
const severityMeta: Record<Severity, { label: string; color: string; penalty: number }> = {
  rough: { label: "Rough", color: "#d89a2b", penalty: 8 },
  bumpy: { label: "Bumpy", color: "#df6f2d", penalty: 15 },
  not_drivable: { label: "Not drivable", color: "#d94b52", penalty: 35 },
};

function insideBounds(point: LatLng) {
  return isInsideSouthZone(point.lat, point.lng);
}

function haversine(a: LatLng, b: LatLng) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
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

function AppMap({ tab, start, end, reports, bumps, routes, onMapPoint }: {
  tab: Tab; start: LatLng | null; end: LatLng | null; reports: Report[]; bumps: Bump[]; routes: RouteOption[]; onMapPoint: (point: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const callbackRef = useRef(onMapPoint);

  useEffect(() => { callbackRef.current = onMapPoint }, [onMapPoint]);
  useEffect(() => {
    let cancelled = false;
    async function mount() {
      const L = await import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
      const boundary = await fetch("/data/bbmp-south-zone.geojson").then((response) => response.json());
      const boundaryLayer = L.geoJSON(boundary, { style: { color: "#246e5a", weight: 2, fillColor: "#54a98b", fillOpacity: 0.07, dashArray: "6 5" } }).addTo(map);
      map.fitBounds(boundaryLayer.getBounds(), { padding: [18, 18] });
      map.on("click", (event: any) => callbackRef.current({ lat: event.latlng.lat, lng: event.latlng.lng }));
    }
    mount();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;
    if (start) L.circleMarker([start.lat, start.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#173f38", fillOpacity: 1 }).bindTooltip("Start").addTo(group);
    if (end) L.circleMarker([end.lat, end.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#1d77d2", fillOpacity: 1 }).bindTooltip("Destination").addTo(group);
    routes.forEach((route, index) => {
      L.polyline(route.geometry.coordinates.map(([lng, lat]) => [lat, lng]), { color: index === 0 ? "#246e5a" : "#4b76c5", opacity: index === 0 ? 0.95 : 0.68, weight: index === 0 ? 7 : 5 })
        .bindTooltip(`${index === 0 ? "Smoothest" : "Alternative"} · ${formatDuration(route.duration)} · ${route.score}/100`).addTo(group);
    });
    reports.forEach((report) => {
      const meta = severityMeta[report.severity];
      L.circleMarker([report.latitude, report.longitude], { radius: report.severity === "not_drivable" ? 9 : 7, color: "#fff", weight: 2, fillColor: meta.color, fillOpacity: 0.95 })
        .bindPopup(`<strong>${meta.label}</strong><br>${report.roadLabel}${report.note ? `<br>${report.note.replace(/[<>]/g, "")}` : ""}`).addTo(group);
    });
    bumps.forEach((bump) => {
      L.circle([bump.latitude, bump.longitude], { radius: Math.min(55, 14 + bump.intensity * 4), color: "#7b52a1", weight: 1, fillColor: "#9b70bf", fillOpacity: 0.2 })
        .bindTooltip(`Anonymous ride signal · ${bump.intensity.toFixed(1)} m/s²`).addTo(group);
    });
  }, [start, end, reports, bumps, routes]);

  return <div className="map-wrap">
    <div ref={containerRef} className="map" aria-label="Interactive map of BBMP South Zone" />
    <div className="map-hint"><MapPin size={15} />{tab === "report" ? "Tap inside the boundary to report a road" : "Tap once for start, again for destination"}</div>
    <div className="map-legend" aria-label="Road condition legend"><span><i className="legend-dot rough" /> Rough</span><span><i className="legend-dot bumpy" /> Bumpy</span><span><i className="legend-dot blocked" /> Not drivable</span><span><i className="legend-ring" /> Ride signal</span></div>
  </div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("explore");
  const [start, setStart] = useState<LatLng | null>(DEFAULT_START);
  const [end, setEnd] = useState<LatLng | null>(DEFAULT_END);
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

  const refreshData = useCallback(async () => {
    const [reportResult, bumpResult] = await Promise.allSettled([
      fetch("/api/reports").then((response) => response.ok ? response.json() : Promise.reject()),
      fetch("/api/bumps").then((response) => response.ok ? response.json() : Promise.reject()),
    ]);
    if (reportResult.status === "fulfilled") setReports(reportResult.value.reports ?? []);
    if (bumpResult.status === "fulfilled") setBumps(bumpResult.value.bumps ?? []);
  }, []);
  useEffect(() => { refreshData() }, [refreshData]);
  useEffect(() => {
    if (!riding) return;
    const timer = window.setInterval(() => setRideStats((stats) => ({ ...stats, elapsed: Math.floor((Date.now() - rideStartRef.current) / 1000) })), 1000);
    return () => window.clearInterval(timer);
  }, [riding]);

  const handleMapPoint = useCallback((point: LatLng) => {
    if (!insideBounds(point)) { setNotice("That point is outside the official BBMP South Zone boundary."); return }
    setNotice("");
    if (tab === "report") { setReportPoint(point); return }
    if (!start || (start && end)) { setStart(point); setEnd(null); setRoutes([]); setRouteState("Now tap a destination") }
    else { setEnd(point); setRouteState("Ready to compare routes") }
  }, [tab, start, end]);

  async function compareRoutes() {
    if (!start || !end) return;
    setRouteState("Finding open-data route alternatives…"); setRoutes([]);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?alternatives=true&overview=full&geometries=geojson&steps=false`;
      const data = await fetch(url).then((response) => { if (!response.ok) throw new Error(); return response.json() });
      const scored = (data.routes ?? []).map((route: any) => scoreRoute({ geometry: route.geometry, duration: route.duration, distance: route.distance }, reports, bumps));
      scored.sort((a: RouteOption, b: RouteOption) => b.score - a.score || a.duration - b.duration);
      setRoutes(scored); setRouteState(scored.length ? `${scored.length} route${scored.length === 1 ? "" : "s"} compared` : "No route found");
    } catch { setRouteState("The community OSRM router is temporarily unavailable. Try again shortly.") }
  }

  function useMyLocation(target: "start" | "report") {
    if (!navigator.geolocation) { setNotice("Location is not supported in this browser."); return }
    navigator.geolocation.getCurrentPosition((position) => {
      const point = { lat: position.coords.latitude, lng: position.coords.longitude };
      if (!insideBounds(point)) { setNotice("Your current location is outside the official BBMP South Zone boundary."); return }
      if (target === "report") setReportPoint(point); else { setStart(point); setEnd(null); setRoutes([]) }
      setNotice("");
    }, () => setNotice("Location permission was not granted."), { enableHighAccuracy: true, timeout: 12000 });
  }

  async function submitReport(event: React.FormEvent) {
    event.preventDefault();
    if (!reportPoint) { setNotice("Tap the map or use your current location first."); return }
    const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ latitude: reportPoint.lat, longitude: reportPoint.lng, severity, roadLabel, note }) });
    const result = await response.json();
    if (!response.ok) { setNotice(result.error ?? "Unable to submit the report"); return }
    setReports((items) => [result.report, ...items]); setRoadLabel(""); setNote(""); setNotice("Anonymous road report added. Thank you.");
  }

  async function startRide() {
    if (!navigator.geolocation || typeof DeviceMotionEvent === "undefined") { setNotice("This browser does not expose the required location and motion sensors."); return }
    try {
      const constructor = DeviceMotionEvent as unknown as MotionEventConstructor;
      if (typeof constructor.requestPermission === "function" && await constructor.requestPermission() !== "granted") throw new Error("Motion permission was not granted");
      sessionRef.current = crypto.randomUUID(); rideStartRef.current = Date.now(); setRideStats({ signals: 0, speed: 0, elapsed: 0 });
      watchRef.current = navigator.geolocation.watchPosition((position) => {
        latestPositionRef.current = position;
        setRideStats((stats) => ({ ...stats, speed: Math.max(0, (position.coords.speed ?? 0) * 3.6) }));
      }, () => setNotice("Keep precise location enabled while recording."), { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 });
      const handler = async (event: DeviceMotionEvent) => {
        const a = event.acceleration;
        const gravity = event.accelerationIncludingGravity;
        const intensity = a && [a.x, a.y, a.z].every((value) => value !== null)
          ? Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2)
          : gravity ? Math.abs(Math.sqrt((gravity.x ?? 0) ** 2 + (gravity.y ?? 0) ** 2 + (gravity.z ?? 0) ** 2) - 9.81) : 0;
        const position = latestPositionRef.current;
        if (intensity < 2.8 || !position || Date.now() - lastBumpRef.current < 2500) return;
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (!insideBounds(point) || position.coords.accuracy > 80) return;
        lastBumpRef.current = Date.now();
        const payload = { latitude: Number(point.lat.toFixed(5)), longitude: Number(point.lng.toFixed(5)), intensity: Number(intensity.toFixed(2)), speedKph: Number(Math.max(0, (position.coords.speed ?? 0) * 3.6).toFixed(1)), accuracyM: Number(position.coords.accuracy.toFixed(1)), sessionId: sessionRef.current };
        setRideStats((stats) => ({ ...stats, signals: stats.signals + 1 }));
        await fetch("/api/bumps", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ events: [payload] }) }).catch(() => undefined);
      };
      motionHandlerRef.current = handler; window.addEventListener("devicemotion", handler); setRiding(true);
      setNotice("Ride recording started. Keep this page open and the phone securely mounted.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to start ride recording") }
  }

  async function stopRide() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (motionHandlerRef.current) window.removeEventListener("devicemotion", motionHandlerRef.current);
    watchRef.current = null; motionHandlerRef.current = null; latestPositionRef.current = null; setRiding(false);
    setNotice("Ride saved anonymously. Only detected bump events were uploaded."); await refreshData();
  }

  useEffect(() => () => {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (motionHandlerRef.current) window.removeEventListener("devicemotion", motionHandlerRef.current);
  }, []);

  const fastest = useMemo(() => routes.length ? [...routes].sort((a, b) => a.duration - b.duration)[0] : null, [routes]);
  const smoothest = routes[0] ?? null;
  const severeCount = reports.filter((report) => report.severity === "not_drivable").length;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand" aria-label="Namma Smooth home"><span className="brand-mark"><Bike size={21} /></span><span><strong>Namma Smooth</strong><small>BBMP South Zone</small></span></div>
      <nav className="nav-tabs" aria-label="Main navigation">
        {([ ["explore", "Explore", RouteIcon], ["report", "Report", MapPin], ["ride", "Ride", Radio], ["ops", "Operations", BarChart3] ] as const).map(([value, label, Icon]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon size={17} />{label}</button>)}
      </nav>
      <div className="privacy-chip"><ShieldCheck size={16} /> Anonymous by design</div>
    </header>

    <section className="workspace">
      <aside className="control-panel">
        {tab === "explore" && <>
          <div className="eyebrow">Two-wheeler route intelligence</div><h1>Choose the ride your back will thank you for.</h1><p className="lede">Compare travel time with road comfort using community reports and anonymous motion signals.</p>
          <div className="field-stack"><label>Start point</label><button className="location-field" onClick={() => useMyLocation("start")}><LocateFixed size={17} /><span>{start ? `${start.lat.toFixed(5)}, ${start.lng.toFixed(5)}` : "Use my location or tap map"}</span></button><label>Destination</label><div className="location-field static"><Navigation size={17} /><span>{end ? `${end.lat.toFixed(5)}, ${end.lng.toFixed(5)}` : "Tap a destination on the map"}</span></div></div>
          <button className="primary-action" disabled={!start || !end} onClick={compareRoutes}><RouteIcon size={18} /> Compare smoothest and fastest</button><p className="status-line">{routeState}</p>
          {smoothest && <div className="route-results"><article className="route-card selected"><div><span className="route-tag">{fastest === smoothest ? "Smoothest + fastest" : "Smoothest"}</span><strong>{formatDuration(smoothest.duration)}</strong></div><p>{(smoothest.distance / 1000).toFixed(1)} km · comfort {smoothest.score}/100</p><small>{smoothest.observations ? `${smoothest.observations} nearby observations` : "No nearby community evidence yet"}</small></article>{fastest && fastest !== smoothest && <article className="route-card"><div><span className="route-tag blue">Fastest</span><strong>{formatDuration(fastest.duration)}</strong></div><p>{(fastest.distance / 1000).toFixed(1)} km · comfort {fastest.score}/100</p><small>{Math.round((smoothest.duration - fastest.duration) / 60)} min faster</small></article>}</div>}
          <div className="data-note"><Info size={16} /><span>Prototype routing uses community OSRM and OpenStreetMap. Live traffic is intentionally absent until a licensed source is selected.</span></div>
        </>}

        {tab === "report" && <form onSubmit={submitReport}>
          <div className="eyebrow">Anonymous road report</div><h1>Mark a road that needs attention.</h1><p className="lede">Tap the map or use your location. No photo, account, name, or phone number is required.</p>
          <button type="button" className="secondary-action" onClick={() => useMyLocation("report")}><LocateFixed size={17} /> Use my current location</button><div className="coordinate-box">{reportPoint ? `${reportPoint.lat.toFixed(5)}, ${reportPoint.lng.toFixed(5)}` : "No road location selected"}</div>
          <fieldset className="severity-picker"><legend>Road condition</legend>{(Object.keys(severityMeta) as Severity[]).map((value) => <label key={value} className={severity === value ? "chosen" : ""}><input type="radio" name="severity" value={value} checked={severity === value} onChange={() => setSeverity(value)} /><i style={{ background: severityMeta[value].color }} />{severityMeta[value].label}</label>)}</fieldset>
          <label className="input-label">Road or landmark <span>optional</span></label><input className="text-input" value={roadLabel} onChange={(event) => setRoadLabel(event.target.value)} maxLength={100} placeholder="e.g. 9th Main near metro station" />
          <label className="input-label">Short note <span>optional</span></label><textarea className="text-input" value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="What should another rider know?" rows={3} />
          <button className="primary-action" type="submit"><Send size={17} /> Submit anonymously</button>
        </form>}

        {tab === "ride" && <>
          <div className="eyebrow">Foreground iPhone sensing</div><h1>Turn one ride into safer road knowledge.</h1><p className="lede">Safari must remain open. The prototype uploads only detected bump events—not your continuous route.</p>
          <div className={`ride-orb ${riding ? "recording" : ""}`}><Bike size={34} /><strong>{riding ? "Recording" : "Ready"}</strong><span>{riding ? "Keep this page open" : "Mount your phone securely"}</span></div>
          <div className="ride-stats"><div><span>Signals</span><strong>{rideStats.signals}</strong></div><div><span>Speed</span><strong>{rideStats.speed.toFixed(0)} <small>km/h</small></strong></div><div><span>Time</span><strong>{Math.floor(rideStats.elapsed / 60)}:{String(rideStats.elapsed % 60).padStart(2, "0")}</strong></div></div>
          {!riding ? <button className="primary-action" onClick={startRide}><Radio size={18} /> Grant access and start ride</button> : <button className="stop-action" onClick={stopRide}><CircleStop size={18} /> Stop and save ride</button>}
          <div className="safety-note"><AlertTriangle size={17} /><span>Set this up before moving. Never interact with the screen while riding.</span></div><details className="privacy-details"><summary>What is collected?</summary><p>Timestamped bump intensity, rounded location, GPS accuracy, and speed at the event. A random session ID links events from this ride and is not reused.</p></details>
        </>}

        {tab === "ops" && <>
          <div className="eyebrow">Prototype operations view</div><h1>Road condition pulse.</h1><p className="lede">A transparent view of evidence collected inside the official BBMP South Zone boundary.</p>
          <div className="metric-grid"><article><span>Reports</span><strong>{reports.length}</strong><small>community submitted</small></article><article><span>Ride signals</span><strong>{bumps.length}</strong><small>motion detected</small></article><article><span>Not drivable</span><strong>{severeCount}</strong><small>needs review</small></article><article><span>Coverage</span><strong>{reports.length + bumps.length ? "Live" : "Empty"}</strong><small>prototype dataset</small></article></div>
          <h2 className="section-title">Recent reports</h2><div className="activity-list">{reports.slice(0, 6).map((report) => <article key={report.id}><i style={{ background: severityMeta[report.severity].color }} /><div><strong>{severityMeta[report.severity].label}</strong><span>{report.roadLabel}</span></div><time>{new Date(report.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</time></article>)}{!reports.length && <div className="empty-state">No reports yet. The dashboard will update as anonymous observations arrive.</div>}</div>
          <div className="data-note"><Gauge size={16} /><span>Low speeds alone never label a road as bad. Traffic, signals, stops, and surface evidence remain separate signals.</span></div>
        </>}
        {notice && <div className="notice" role="status">{notice}</div>}
      </aside>
      <div className="map-panel"><AppMap tab={tab} start={start} end={end} reports={reports} bumps={bumps} routes={routes} onMapPoint={handleMapPoint} /><div className="source-bar"><span>Boundary: OpenCity / KSRSAC, BBMP Zone Boundaries 2022</span><span>Basemap: OpenStreetMap</span><span className="prototype-badge">Prototype · not navigation advice</span></div></div>
    </section>
  </main>;
}

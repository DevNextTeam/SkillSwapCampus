import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, API_BASE } from "./api";
import { MapPin, LocateFixed, Radio, ShieldCheck, Users, RefreshCw, AlertCircle } from "lucide-react";
import "./CampusMapPage.css";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      link.dataset.leaflet = "true";
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-leaflet="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", () => reject(new Error("The map library could not be loaded.")), { once: true });
      if (window.L) resolve(window.L);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.leaflet = "true";
    script.onload = () => window.L ? resolve(window.L) : reject(new Error("The map library did not initialize."));
    script.onerror = () => reject(new Error("The map library could not be loaded. Check your internet connection."));
    document.head.appendChild(script);
  });
}

function initials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ST";
}

export default function CampusMapPage({ user }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const watchRef = useRef(null);
  const lastSentRef = useRef(0);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [myPosition, setMyPosition] = useState(null);

  const loadLocations = useCallback(async () => {
    try {
      const result = await apiRequest("live_locations.php");
      setLocations(result.locations || []);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load live student locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    loadLeaflet().then((L) => {
      if (!alive || !mapElement.current || mapRef.current) return;
      const map = L.map(mapElement.current, { zoomControl: true }).setView([12.8797, 121.774], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 100);
    }).catch((err) => setError(err.message));
    return () => {
      alive = false;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    loadLocations();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadLocations();
    }, 12000);
    const refresh = () => { if (document.visibilityState === "visible") loadLocations(); };
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [loadLocations]);

  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map || !mapReady) return;
    const currentIds = new Set(locations.map((item) => String(item.user_id)));
    for (const [id, marker] of markersRef.current.entries()) {
      if (!currentIds.has(id)) { marker.remove(); markersRef.current.delete(id); }
    }
    locations.forEach((student) => {
      const id = String(student.user_id);
      const isMe = Number(student.user_id) === Number(user.id);
      const label = isMe ? "You" : student.full_name;
      const avatar = student.profile_photo
        ? '<img src="' + String(API_BASE + "/" + student.profile_photo).replace(/&/g, "&amp;").replace(/"/g, "&quot;") + '" alt="">'
        : '<span>' + initials(student.full_name) + '</span>';
      const html = '<div class="campus-map-marker ' + (isMe ? "is-me" : "") + '">' + avatar + '</div>';
      const icon = L.divIcon({ className: "campus-map-icon", html, iconSize: [42, 42], iconAnchor: [21, 21] });
      const popup = '<div class="campus-map-popup"><strong>' + (label || "Campus student").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])) + '</strong><span>' + (student.university || "SkillSwap Campus").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])) + '</span><small>Updated ' + new Date(student.updated_at.replace(" ", "T") + (student.updated_at.includes("Z") ? "" : "Z")).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + '</small></div>';
      const point = [Number(student.latitude), Number(student.longitude)];
      if (markersRef.current.has(id)) {
        markersRef.current.get(id).setLatLng(point).setPopupContent(popup);
      } else {
        const marker = L.marker(point, { icon }).addTo(map).bindPopup(popup);
        markersRef.current.set(id, marker);
      }
    });
  }, [locations, mapReady, user.id]);

  const stopSharing = useCallback(async (announce = true) => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setSharing(false);
    setMyPosition(null);
    try {
      await apiRequest("live_locations.php", { method: "POST", body: JSON.stringify({ stop: true }) });
      await loadLocations();
      if (announce) setMessage("Your location is no longer shared.");
    } catch (err) {
      if (announce) setError(err.message || "Could not stop location sharing on the server.");
    }
  }, [loadLocations]);

  const startSharing = () => {
    setError("");
    setMessage("");
    if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
      setError("Location sharing requires HTTPS. Open SkillSwap Campus through a secure connection.");
      return;
    }
    if (!navigator.geolocation) {
      setError("This browser does not support location sharing.");
      return;
    }
    setMessage("Waiting for your browser's location permission…");
    const watchId = navigator.geolocation.watchPosition(async (position) => {
      const coords = position.coords;
      setMyPosition({ latitude: coords.latitude, longitude: coords.longitude });
      setSharing(true);
      setMessage("Your live location is being shared with signed-in campus students.");
      const now = Date.now();
      if (now - lastSentRef.current < 10000) return;
      lastSentRef.current = now;
      try {
        await apiRequest("live_locations.php", {
          method: "POST",
          body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
        });
        loadLocations();
      } catch (err) {
        setError(err.message || "Your location could not be shared.");
      }
    }, (geoError) => {
      setSharing(false);
      const reasons = {
        1: "Location permission was denied. Allow location access in your browser settings to share.",
        2: "Your device could not determine your location. Try again somewhere with a clearer GPS signal.",
        3: "Getting your location timed out. Please try again.",
      };
      setError(reasons[geoError.code] || "Unable to get your location.");
      setMessage("");
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
    watchRef.current = watchId;
  };

  useEffect(() => () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
  }, []);

  const centerOnMe = () => {
    if (myPosition && mapRef.current) mapRef.current.setView([myPosition.latitude, myPosition.longitude], 16);
    else setMessage("Enable Share my location to center the map on your position.");
  };

  return (
    <div className="campus-map-page">
      <section className="campus-map-intro">
        <div className="campus-map-intro-icon"><MapPin size={23} /></div>
        <div><span className="campus-map-eyebrow">CAMPUS COMMUNITY · LIVE</span><h2>Find your people on campus.</h2><p>See students who have chosen to share where they are. Your exact location stays private until you turn sharing on.</p></div>
      </section>
      <section className="campus-map-controls">
        <div className="campus-map-status"><span className={sharing ? "live-dot active" : "live-dot"} /> <div><strong>{sharing ? "You're sharing your location" : "Location sharing is off"}</strong><small>{locations.length} student{locations.length === 1 ? "" : "s"} currently visible</small></div></div>
        <div className="campus-map-actions">
          {!sharing ? <button type="button" className="campus-map-share" onClick={startSharing}><Radio size={17} /> Share my location</button> : <button type="button" className="campus-map-stop" onClick={() => stopSharing()}><ShieldCheck size={17} /> Stop sharing</button>}
          <button type="button" className="campus-map-secondary" onClick={centerOnMe} title="Center map on my location"><LocateFixed size={17} /></button>
          <button type="button" className="campus-map-secondary" onClick={loadLocations} title="Refresh student locations"><RefreshCw size={16} /></button>
        </div>
      </section>
      {message && <p className="campus-map-notice" role="status">{message}</p>}
      {error && <p className="campus-map-error" role="alert"><AlertCircle size={16} />{error}</p>}
      <section className="campus-map-layout">
        <div className="campus-map-canvas-wrap"><div ref={mapElement} className="campus-map-canvas" aria-label="Live map of students sharing their location" />{!mapReady && <div className="campus-map-loading">Loading interactive map…</div>}</div>
        <aside className="campus-map-roster"><div className="campus-map-roster-heading"><div><h3>Students nearby</h3><p>Live location sharing</p></div><Users size={19} /></div>
          {loading ? <p className="campus-map-roster-empty">Loading student locations…</p> : locations.length === 0 ? <div className="campus-map-roster-empty"><MapPin size={22}/><strong>No students sharing yet</strong><span>Turn on your location to be the first on the map.</span></div> : <div className="campus-map-roster-list">{locations.map((student) => <button type="button" key={student.user_id} className="campus-map-roster-person" onClick={() => mapRef.current?.setView([Number(student.latitude), Number(student.longitude)], 16)}><span className="campus-map-roster-avatar">{student.profile_photo ? <img src={API_BASE + "/" + student.profile_photo} alt="" /> : initials(student.full_name)}</span><span><strong>{Number(student.user_id) === Number(user.id) ? "You" : student.full_name}</strong><small>{student.university || student.course || "Campus student"}</small></span><span className="campus-map-roster-live" /></button>)}</div>}
          <div className="campus-map-privacy"><ShieldCheck size={17}/><span>Only signed-in students can see shared locations. Locations expire automatically after two minutes without an update.</span></div>
        </aside>
      </section>
      <p className="campus-map-footnote">Map data © OpenStreetMap contributors. Student locations update while sharing is enabled and this page is open.</p>
    </div>
  );
}

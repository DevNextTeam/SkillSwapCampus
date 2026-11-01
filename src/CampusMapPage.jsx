import { useCallback, useEffect, useRef, useState } from "react";
import { apiRequest, API_BASE } from "./api";
import { MapPin, LocateFixed, Radio, ShieldCheck, Users, RefreshCw, AlertCircle, Search, UserPlus, MessageCircle, X, GraduationCap } from "lucide-react";
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

export default function CampusMapPage({ user, onNavigate }) {
  const mapElement = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const watchRef = useRef(null);
  const lastSentRef = useRef(0);
  const lastCoordsRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [myPosition, setMyPosition] = useState(null);
  const [precision, setPrecision] = useState("exact");
  const [search, setSearch] = useState("");
  const [universityFilter, setUniversityFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [friendBusy, setFriendBusy] = useState(false);

  const visibleLocations = locations.filter((student) => {
    const query = search.trim().toLowerCase();
    const matches = !query || [student.full_name, student.university, student.course].some((value) => (value || "").toLowerCase().includes(query));
    return matches && (universityFilter === "all" || student.university === universityFilter) && (courseFilter === "all" || student.course === courseFilter);
  });
  const universities = [...new Set(locations.map((student) => student.university).filter(Boolean))].sort();
  const courses = [...new Set(locations.map((student) => student.course).filter(Boolean))].sort();
  const distanceKm = (a, b) => { const rad = (value) => value * Math.PI / 180; const dLat = rad(Number(b.latitude) - Number(a.latitude)); const dLng = rad(Number(b.longitude) - Number(a.longitude)); const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(Number(a.latitude))) * Math.cos(rad(Number(b.latitude))) * Math.sin(dLng / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); };

  const openStudentProfile = async (student) => {
    setSelectedStudent({ id: student.user_id, full_name: student.full_name, university: student.university, course: student.course, profile_photo: student.profile_photo });
    setProfileLoading(true); setProfileError(""); setProfileNotice("");
    try { const result = await apiRequest("get_student_profile.php?id=" + encodeURIComponent(student.user_id)); setSelectedStudent(result.student); }
    catch (err) { setProfileError(err.message || "Unable to load this profile."); }
    finally { setProfileLoading(false); }
  };

  const sendFriendRequest = async () => {
    if (!selectedStudent) return;
    setFriendBusy(true); setProfileError(""); setProfileNotice("");
    try { const result = await apiRequest("friend_request.php", { method: "POST", body: JSON.stringify({ user_id: selectedStudent.id, action: "send" }) }); setProfileNotice(result.message || "Friend request sent."); const refreshed = await apiRequest("get_student_profile.php?id=" + encodeURIComponent(selectedStudent.id)); setSelectedStudent(refreshed.student); }
    catch (err) { setProfileError(err.message || "Unable to send friend request."); }
    finally { setFriendBusy(false); }
  };

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
    visibleLocations.forEach((student) => {
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
        marker.on("click", () => openStudentProfile(student));
        markersRef.current.set(id, marker);
      }
    });
  }, [visibleLocations, mapReady, user.id]);

  const stopSharing = useCallback(async (announce = true) => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setSharing(false);
    setMyPosition(null);
    lastCoordsRef.current = null;
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
    lastSentRef.current = 0;
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
      const decimals = precision === "approximate" ? 2 : 7;
      const nextCoords = { latitude: Number(coords.latitude.toFixed(decimals)), longitude: Number(coords.longitude.toFixed(decimals)), accuracy: precision === "approximate" ? Math.max(coords.accuracy || 0, 1000) : coords.accuracy };
      lastCoordsRef.current = nextCoords;
      setMyPosition({ latitude: coords.latitude, longitude: coords.longitude });
      setSharing(true);
      setMessage("Your live location is being shared with signed-in campus students.");
      const now = Date.now();
      if (now - lastSentRef.current < 10000) return;
      lastSentRef.current = now;
      try {
        await apiRequest("live_locations.php", {
          method: "POST",
          body: JSON.stringify(nextCoords),
        });
        loadLocations();
      } catch (err) {
        setError(err.message || "Your location could not be shared.");
      }
    }, (geoError) => {
      setSharing(false);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      lastCoordsRef.current = null;
      apiRequest("live_locations.php", { method: "POST", body: JSON.stringify({ stop: true }) }).then(loadLocations).catch(() => {});
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

  useEffect(() => {
    if (!sharing) return undefined;
    const heartbeat = window.setInterval(async () => {
      if (!lastCoordsRef.current || document.visibilityState !== "visible") return;
      try {
        await apiRequest("live_locations.php", { method: "POST", body: JSON.stringify(lastCoordsRef.current) });
        loadLocations();
      } catch (err) { setError(err.message || "Your live location update failed."); }
    }, 30000);
    return () => window.clearInterval(heartbeat);
  }, [sharing, loadLocations]);

  useEffect(() => () => {
    if (watchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchRef.current);
    // Leaving the map stops live sharing immediately; the server also expires stale records.
    apiRequest("live_locations.php", { method: "POST", body: JSON.stringify({ stop: true }) }).catch(() => {});
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
        <div className="campus-map-status"><span className={sharing ? "live-dot active" : "live-dot"} /> <div><strong>{sharing ? "You're sharing your location" : "Location sharing is off"}</strong><small>{visibleLocations.length} student{visibleLocations.length === 1 ? "" : "s"} currently visible</small></div></div>
        <div className="campus-map-actions">
          <label className="campus-map-precision">Precision<select value={precision} onChange={(event) => setPrecision(event.target.value)} disabled={sharing}><option value="exact">Exact GPS</option><option value="approximate">Approximate (~1 km)</option></select></label>
          {!sharing ? <button type="button" className="campus-map-share" onClick={startSharing}><Radio size={17} /> Share my location</button> : <button type="button" className="campus-map-stop" onClick={() => stopSharing()}><ShieldCheck size={17} /> Stop sharing</button>}
          <button type="button" className="campus-map-secondary" onClick={centerOnMe} title="Center map on my location"><LocateFixed size={17} /></button>
          <button type="button" className="campus-map-secondary" onClick={loadLocations} title="Refresh student locations"><RefreshCw size={16} /></button>
        </div>
      </section>
      {message && <p className="campus-map-notice" role="status">{message}</p>}
      {error && <p className="campus-map-error" role="alert"><AlertCircle size={16} />{error}</p>}
      <section className="campus-map-discovery"><div className="campus-map-search"><Search size={17}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, university, or course" aria-label="Search students"/></div><select value={universityFilter} onChange={(event) => setUniversityFilter(event.target.value)} aria-label="Filter university"><option value="all">All universities</option>{universities.map((name) => <option key={name} value={name}>{name}</option>)}</select><select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} aria-label="Filter course"><option value="all">All courses</option>{courses.map((name) => <option key={name} value={name}>{name}</option>)}</select><span>{visibleLocations.length} students</span></section>
      <section className="campus-map-layout">
        <div className="campus-map-canvas-wrap"><div ref={mapElement} className="campus-map-canvas" aria-label="Live map of students sharing their location" />{!mapReady && <div className="campus-map-loading">Loading interactive map…</div>}</div>
        <aside className="campus-map-roster"><div className="campus-map-roster-heading"><div><h3>Students nearby</h3><p>Live location sharing</p></div><Users size={19} /></div>
          {loading ? <p className="campus-map-roster-empty">Loading student locations…</p> : visibleLocations.length === 0 ? <div className="campus-map-roster-empty"><MapPin size={22}/><strong>No students sharing yet</strong><span>Turn on your location to be the first on the map.</span></div> : <div className="campus-map-roster-list">{visibleLocations.map((student) => <button type="button" key={student.user_id} className="campus-map-roster-person" onClick={() => { mapRef.current?.setView([Number(student.latitude), Number(student.longitude)], 16); openStudentProfile(student); }}><span className="campus-map-roster-avatar">{student.profile_photo ? <img src={API_BASE + "/" + student.profile_photo} alt="" /> : initials(student.full_name)}</span><span><strong>{Number(student.user_id) === Number(user.id) ? "You" : student.full_name}</strong><small>{student.university || student.course || "Campus student"}</small></span><span className="campus-map-roster-distance">{myPosition ? distanceKm(myPosition, student).toFixed(1) + " km" : "View"}</span></button>)}</div>}
          <div className="campus-map-privacy"><ShieldCheck size={17}/><span>Only signed-in students can see shared locations. Locations expire automatically after two minutes without an update.</span></div>
        </aside>
      </section>
      {selectedStudent && <div className="campus-map-modal-backdrop" onClick={(event) => { if (event.target === event.currentTarget) setSelectedStudent(null); }}>
        <section className="campus-map-profile-modal" role="dialog" aria-modal="true" aria-label="Student profile">
          <button type="button" className="campus-map-modal-close" onClick={() => setSelectedStudent(null)} aria-label="Close"><X size={19}/></button>
          {profileLoading ? <p>Loading profile…</p> : <>
            <div className="campus-map-profile-head"><span className="campus-map-profile-avatar">{selectedStudent.profile_photo ? <img src={API_BASE + "/" + selectedStudent.profile_photo} alt=""/> : initials(selectedStudent.full_name)}</span><div><h3>{selectedStudent.full_name}</h3><p>{selectedStudent.university || "SkillSwap student"}</p><small>{selectedStudent.course || "Course not listed"}{selectedStudent.year_level ? " · Year " + selectedStudent.year_level : ""}</small></div></div>
            {selectedStudent.bio && <p className="campus-map-profile-bio">{selectedStudent.bio}</p>}
            <div className="campus-map-profile-skills"><h4><GraduationCap size={16}/> Skills</h4>{selectedStudent.skills?.length ? <div>{selectedStudent.skills.map((skill) => <span key={skill.id}>{skill.skill_name} · {skill.skill_type === "offer" ? "Can teach" : "Wants to learn"}</span>)}</div> : <p>No skills listed yet.</p>}</div>
            {profileError && <p className="campus-map-error">{profileError}</p>}{profileNotice && <p className="campus-map-notice">{profileNotice}</p>}
            <div className="campus-map-profile-actions"><button type="button" className="campus-map-profile-primary" disabled={friendBusy || selectedStudent.friend_status?.status === "accepted" || selectedStudent.friend_status?.status === "pending"} onClick={sendFriendRequest}><UserPlus size={16}/>{friendBusy ? "Sending…" : selectedStudent.friend_status?.status === "accepted" ? "Already friends" : selectedStudent.friend_status?.status === "pending" ? (Number(selectedStudent.friend_status.sender_id) === Number(user.id) ? "Request sent" : "Request received") : "Add friend"}</button><button type="button" className="campus-map-profile-secondary" onClick={() => onNavigate?.("Friends & Messages")}><MessageCircle size={16}/> Message</button></div>
          </>}
        </section>
      </div>}
      <p className="campus-map-footnote">Map data © OpenStreetMap contributors. Student locations update while sharing is enabled and this page is open.</p>
    </div>
  );
}

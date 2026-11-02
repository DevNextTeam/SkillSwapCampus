
import { useCallback, useEffect, useRef, useState } from "react";
import AppFooter from "./AppFooter";

import {
  LayoutDashboard,
  Search,
  Compass,
  CalendarDays,
  UserRound,
  BookOpen,
  Bell,
  Plus,
  ArrowUpRight,
  Sparkles,
  Code2,
  Palette,
  Menu,
  X,
  LogOut,
  Save,
  Pencil,
  Users,
  CheckCircle2,
  MapPinned,
} from "lucide-react";

import Auth from "./Auth";
import SkillsPage from "./SkillsPage";
import ExchangesPage from "./ExchangesPage";
import SchedulePage from "./SchedulePage";
import DiscoverStudentsPage from "./DiscoverStudentsPage";
import SocialPage from "./SocialPage";
import CampusMapPage from "./CampusMapPage";
import { apiRequest, API_BASE } from "./api";
import "./App.css";


const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Discover Students", icon: Search },
  { label: "Friends & Messages", icon: Users },
  { label: "Live Campus Map", icon: MapPinned },
  { label: "Explore Skills", icon: Compass },
  { label: "My Exchanges", icon: ArrowUpRight },
  { label: "My Schedule", icon: CalendarDays },
  { label: "My Profile", icon: UserRound },
];

// STUDENT PROFILE COMPONENT
function formatSkillTimeAgo(createdAt, now = Date.now()) {
  if (!createdAt) return "Recently";
  const timestamp = new Date(String(createdAt).replace(" ", "T")).getTime();
  if (!Number.isFinite(timestamp)) return "Recently";
  const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ProfilePage({ user, onProfileUpdated }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    university: user.university || "",
    course: user.course || "",
    year_level: user.year_level || "",
    bio: user.bio || "",
  });
  const [skills, setSkills] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest("get_skills.php")
      .then((result) => {
        if (active) {
          const mine = (result.skills || []).filter(
            (skill) => Number(skill.user_id) === Number(user.id)
          );
          setSkills(mine);
        }
      })
      .catch(() => { if (active) setSkills([]); });
    return () => { active = false; };
  }, [user.id]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const result = await apiRequest("update_profile.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onProfileUpdated(result.user);
      setForm((previous) => ({ ...previous, ...result.user }));
      setEditing(false);
      setMessage("Profile saved.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.message || "Unable to save your profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(event) {
    const photo = event.target.files?.[0];
    if (!photo) return;
    if (photo.size > 3 * 1024 * 1024) { setMessage("Photo must be 3 MB or smaller."); setMessageType("error"); return; }
    const body = new FormData(); body.append("photo", photo); setPhotoUploading(true);
    try { const result = await apiRequest("upload_profile_photo.php", { method: "POST", body }); onProfileUpdated(result.user); setMessage("Profile photo updated."); setMessageType("success"); }
    catch (error) { setMessage(error.message || "Unable to upload photo."); setMessageType("error"); }
    finally { setPhotoUploading(false); event.target.value = ""; }
  }

  const initials = form.full_name.trim().split(/\s+/).filter(Boolean)
    .map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="profile-page">
      <form className="profile-intro profile-modern-card" onSubmit={handleSubmit}>
        <div className="profile-photo-wrap">{user.profile_photo ? <img className="profile-large-avatar profile-photo-image" src={`${API_BASE}/${user.profile_photo}`} alt={`${form.full_name} profile`} /> : <div className="profile-large-avatar">{initials}</div>}{editing && <label className="profile-photo-upload">{photoUploading ? "Uploading..." : "Change photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={photoUploading} /></label>}</div>
        <div className="profile-identity">
          <h2 title={form.full_name}>{form.full_name || "Your Name"}</h2>
          {editing ? (
            <textarea className="profile-bio-editor" name="bio" value={form.bio}
              onChange={handleChange} placeholder="Write a short bio..." maxLength={500} rows={2} />
          ) : (
            form.bio?.trim() ? <p className="profile-bio">{form.bio}</p> : null
          )}
          <div className="profile-meta">
            {form.university && <span>{form.university}</span>}
            {form.course && <span>{form.course}</span>}
            {form.year_level && <span>{form.year_level}</span>}
          </div>
        </div>
        {!editing ? (
          <button type="button" className="primary-button profile-edit-button" onClick={() => setEditing(true)}>
            <Pencil size={16} /> Edit profile
          </button>
        ) : (
          <div className="profile-form-actions">
            <button type="button" className="skill-cancel-button" onClick={() => {
              setForm({ full_name: user.full_name || "", university: user.university || "", course: user.course || "", year_level: user.year_level || "", bio: user.bio || "" });
              setEditing(false);
            }} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}><Save size={16} />{saving ? "Saving..." : "Save"}</button>
          </div>
        )}
        {editing && <div className="profile-edit-fields">
          <label>Full name<input name="full_name" value={form.full_name} onChange={handleChange} required maxLength={100} /></label>
          <label>University<input name="university" value={form.university} onChange={handleChange} maxLength={150} /></label>
          <label>Course / program<input name="course" value={form.course} onChange={handleChange} maxLength={100} /></label>
          <label>Year level<select name="year_level" value={form.year_level} onChange={handleChange}>
            <option value="">Select year</option><option>1st Year</option><option>2nd Year</option><option>3rd Year</option><option>4th Year</option><option>5th Year</option><option>Graduate Student</option><option>Other</option>
          </select></label>
        </div>}
        {message && <div className={`profile-message ${messageType}`}>{message}</div>}
      </form>

      <section className="profile-skills-card">
        <div className="profile-skills-heading"><div><h2>Skills</h2><p>Your shared knowledge and learning goals</p></div><span>{skills.length}</span></div>
        {skills.length ? <div className="profile-skills-grid">{skills.map((skill) => (
          <article className="profile-skill-item" key={skill.id}>
            <span className={skill.skill_type === "offer" ? "profile-skill-kind offer" : "profile-skill-kind learn"}>{skill.skill_type === "offer" ? "Can teach" : "Wants to learn"}</span>
            <h3>{skill.skill_name}</h3><p>{skill.category || "General"}</p>
          </article>
        ))}</div> : <div className="profile-skills-empty"><div className="profile-empty-mark"><BookOpen size={22} /></div><h3>No skills added yet</h3><p>Share a skill or add something you want to learn.</p></div>}
      </section>
    </div>
  );
}

// MAIN APPLICATION
function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [skillMode, setSkillMode] = useState("browse");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardSkills, setDashboardSkills] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardClock, setDashboardClock] = useState(() => Date.now());
  const [dashboardExchanges, setDashboardExchanges] = useState([]);
  const [dashboardFriends, setDashboardFriends] = useState([]);
  const [dashboardOverviewLoading, setDashboardOverviewLoading] = useState(true);
  const [dashboardRequestedSkills, setDashboardRequestedSkills] = useState([]);
  const [dashboardRequestingId, setDashboardRequestingId] = useState(null);
  const [dashboardExchangeNotice, setDashboardExchangeNotice] = useState("");
  const [dashboardExchangeNoticeType, setDashboardExchangeNoticeType] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationRequestId = useRef(0);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showStartupSplash] = useState(() => { try { return window.sessionStorage.getItem("skillswap-session-active") !== "1"; } catch { return true; } });

  // Load dashboard data only after authentication is ready. Re-run when the
  // signed-in student changes so a fresh login never keeps the unauthenticated
  // first-load result or another student's cached dashboard data.
  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    let requestInFlight = false;

    async function loadDashboardSkills() {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const result = await apiRequest("get_skills.php");
        if (active) {
          const loadedSkills = result.skills || [];
          setDashboardSkills(loadedSkills);
          setDashboardRequestedSkills(
            loadedSkills
              .filter((skill) => Number(skill.has_requested) === 1)
              .map((skill) => Number(skill.id))
          );
        }
      } catch (error) {
        // Keep the last successful feed during a temporary network failure.
        console.error("Unable to load dashboard skills:", error);
      } finally {
        requestInFlight = false;
        if (active) setDashboardLoading(false);
      }
    }

    const refresh = () => {
      if (document.visibilityState === "visible") loadDashboardSkills();
    };

    loadDashboardSkills();
    const refreshTimer = window.setInterval(refresh, 15000);
    const clockTimer = window.setInterval(() => setDashboardClock(Date.now()), 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user?.id]);

  // Keep exchange and friend totals tied to the active account and refresh
  // them periodically so the dashboard reflects actions from either student.
  useEffect(() => {
    if (!user?.id) return undefined;

    let active = true;
    let requestInFlight = false;

    async function loadDashboardOverview(showLoading = false) {
      if (requestInFlight) return;
      requestInFlight = true;
      if (showLoading) setDashboardOverviewLoading(true);

      const [exchangeResult, socialResult] = await Promise.allSettled([
        apiRequest("get_exchanges.php"),
        apiRequest("social.php"),
      ]);

      if (active) {
        if (exchangeResult.status === "fulfilled") {
          setDashboardExchanges(exchangeResult.value.exchanges || []);
        }
        if (socialResult.status === "fulfilled") {
          setDashboardFriends(socialResult.value.friends || []);
        }
        if (showLoading) setDashboardOverviewLoading(false);
      }

      requestInFlight = false;
    }

    loadDashboardOverview(true);

    const refresh = () => {
      if (document.visibilityState === "visible") loadDashboardOverview();
    };
    const refreshTimer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [user?.id]);

  async function requestDashboardExchange(skill) {
    if (dashboardRequestingId !== null) return;
    setDashboardRequestingId(Number(skill.id));
    setDashboardExchangeNotice("");
    setDashboardExchangeNoticeType("");
    try {
      const result = await apiRequest("request_exchange.php", {
        method: "POST",
        body: JSON.stringify({ skill_id: skill.id }),
      });
      setDashboardRequestedSkills((previous) => [...new Set([...previous, Number(skill.id)])]);
      setDashboardExchangeNotice(result.message || "Exchange request sent successfully!");
      setDashboardExchangeNoticeType("success");
    } catch (error) {
      setDashboardExchangeNotice(error.message || "Unable to send your exchange request.");
      setDashboardExchangeNoticeType("error");
    } finally {
      setDashboardRequestingId(null);
    }
  }

  const loadNotifications = useCallback(async () => {
    const requestId = ++notificationRequestId.current;
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const result = await apiRequest("notifications.php");
      if (requestId === notificationRequestId.current) {
        setNotifications(Array.isArray(result.notifications) ? result.notifications : []);
      }
    } catch (error) {
      if (requestId === notificationRequestId.current) {
        setNotificationsError(error.message || "Unable to load notifications.");
      }
    } finally {
      if (requestId === notificationRequestId.current) setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const initialLoad = window.setTimeout(loadNotifications, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") loadNotifications();
    }, 30000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadNotifications();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      notificationRequestId.current += 1;
    };
  }, [user, loadNotifications]);

    // Play downloaded startup sound when the splash screen appears.
    useEffect(() => {
      if (!authLoading || !showStartupSplash) return;

      const audio = new Audio("/sounds/loading-sound.mp3");
      audio.volume = 0.75;
      audio.preload = "auto";

      const playSound = async () => {
        try {
          await audio.play();
        } catch (error) {
          console.warn("Browser blocked startup audio:", error);
        }
      };

      playSound();

      return () => {
        audio.pause();
        audio.currentTime = 0;
        audio.removeAttribute("src");
        audio.load();
      };
    }, [authLoading, showStartupSplash]);

  // Restore an existing login session instead of logging students out on refresh.
  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      const startedAt = Date.now();
      let restoredUser = null;
      try {
        const result = await apiRequest("me.php");
        restoredUser = result.user || null;
      } catch {
        // A missing or expired session should lead to the login screen.
        restoredUser = null;
      } finally {
        // Keep the branded splash visible briefly so startup never flashes past unnoticed.
        const remaining = showStartupSplash ? Math.max(0, 3500 - (Date.now() - startedAt)) : 0;
        if (remaining) {
          await new Promise((resolve) => window.setTimeout(resolve, remaining));
        }
        if (isMounted) {
          setUser(restoredUser);
          if (restoredUser) { try { window.sessionStorage.setItem("skillswap-session-active", "1"); } catch { /* Storage may be unavailable in private browsing. */ } }
          setAuthLoading(false);
        }
      }
    }

    initializeApp();
    return () => {
      isMounted = false;
    };
  }, [showStartupSplash]);

  // LOG OUT.
  async function handleLogout() {
    try {
      await apiRequest("logout.php", {
        method: "POST",
      });

      setUser(null);
      setDashboardSkills([]);
      setDashboardRequestedSkills([]);
      setDashboardLoading(true);
      setDashboardExchanges([]);
      setDashboardFriends([]);
      setDashboardOverviewLoading(true);
      try { window.sessionStorage.removeItem("skillswap-session-active"); } catch { /* Storage may be unavailable in private browsing. */ }
      setActivePage("Dashboard");
      setSkillMode("browse");
      setMenuOpen(false);

    } catch (error) {
      alert(error.message || "Unable to log out. Please try again.");
    }
  }

  // OPEN THE SKILL CREATION FORM.
  function openSkillForm() {
    setSkillMode("create");
    setActivePage("Share a Skill");
    setMenuOpen(false);
  }

  // SWITCH BETWEEN SKILL BROWSING AND CREATION.
  function handleSkillModeChange(mode) {
    setSkillMode(mode);

    setActivePage(
      mode === "create" ? "Share a Skill" : "Explore Skills"
    );
  }

  const userInitials = user?.full_name
    ? user.full_name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "ST";



  const dashboardMyLearning = dashboardSkills.filter(
    (skill) => Number(skill.user_id) === Number(user?.id) && skill.skill_type === "learn"
  );
  const dashboardRecommendedSkills = dashboardSkills
    .filter((skill) => skill.skill_type === "offer" && Number(skill.user_id) !== Number(user?.id))
    .map((skill) => {
      const skillName = (skill.skill_name || "").toLowerCase();
      const category = (skill.category || "").toLowerCase();
      const matchedInterest = dashboardMyLearning.find((interest) => {
        const interestName = (interest.skill_name || "").toLowerCase();
        const interestCategory = (interest.category || "").toLowerCase();
        return (category && interestCategory && category === interestCategory) ||
          (skillName && interestName && (skillName.includes(interestName) || interestName.includes(skillName)));
      });
      return matchedInterest ? { ...skill, matchedInterest: matchedInterest.skill_name } : null;
    })
    .filter(Boolean)
    .slice(0, 3);
  const dashboardPending = dashboardExchanges.filter((item) => item.status === "pending").length;
  const dashboardAccepted = dashboardExchanges.filter((item) => item.status === "accepted").length;
  const dashboardCompleted = dashboardExchanges.filter((item) => item.status === "completed").length;

  // LOGO AND ANIMATED LOADING SCREEN.
  if (authLoading && showStartupSplash) {
    return (
      <div className="app-splash-screen">
        <div className="splash-content">
          <img
            src="/icons/icon-512.png"
            alt="SkillSwap Campus Logo"
            className="splash-logo"
          />

          <div className="splash-loader" role="status" aria-label="Loading your campus community">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    );
  }

  // Avoid showing a loading screen on ordinary browser refreshes.
  if (authLoading) return null;

  // SHOW LOGIN PAGE AFTER THE STARTUP SCREEN.
  if (!user) {
    return <Auth onLogin={(nextUser) => {
      setDashboardSkills([]);
      setDashboardRequestedSkills([]);
      setDashboardLoading(true);
      setDashboardExchanges([]);
      setDashboardFriends([]);
      setDashboardOverviewLoading(true);
      try { window.sessionStorage.setItem("skillswap-session-active", "1"); } catch { /* Storage may be unavailable in private browsing. */ }
      setUser(nextUser);
    }} />;
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <img
              src="/icons/icon-192.png"
              alt="SkillSwap logo"
              className="brand-logo-image"
            />
          </div>

          <div>
            <h2>SkillSwap</h2>
            <span>CAMPUS COMMUNITY</span>
          </div>

          <button
            className="icon-button mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-active" : ""
              }`}
              onClick={() => {
                setActivePage(label);

                if (label === "Explore Skills") {
                  setSkillMode("browse");
                }

                setMenuOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="sidebar-bottom">
          <div className="help-card">
            <Sparkles size={20} />

            <h3>Learn something new</h3>

            <p>
              Share what you know. Discover what you can learn.
            </p>

            <button
              onClick={() => {
                setSkillMode("browse");
                setActivePage("Explore Skills");
              }}
            >
              Explore skills <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="profile-mini">
            <div className="avatar avatar-green">
              {userInitials}
            </div>

            <div className="profile-mini-info">
              <strong>{user.full_name}</strong>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {menuOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOP BAR */}
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>

          <div className="breadcrumb">
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <div className="notification-wrap">
              <button type="button" className="icon-button notification-button" aria-label="Notifications" title="Notifications" aria-expanded={notificationsOpen} onClick={() => { const next = !notificationsOpen; setNotificationsOpen(next); if (next) loadNotifications(); }}>
                <Bell size={20} />
                {notifications.length > 0 && <span className="notification-count">{notifications.length > 9 ? "9+" : notifications.length}</span>}
              </button>
              {notificationsOpen && <div className="notification-panel">
                <div className="notification-panel-heading"><div><strong>Notifications</strong><small>Your campus activity</small></div><button type="button" onClick={loadNotifications} aria-label="Refresh notifications">Refresh</button></div>
                {notificationsLoading ? <p className="notification-empty">Loading notifications…</p> : notificationsError ? <p className="notification-empty notification-error">{notificationsError}</p> : notifications.length === 0 ? <p className="notification-empty">You're all caught up. New friend requests, messages, and exchange activity will appear here.</p> : <div className="notification-list">{notifications.map((item) => <button type="button" className="notification-item" key={item.id} onClick={() => { setNotificationsOpen(false); setActivePage(item.type === "message" || item.type === "friend_request" ? "Friends & Messages" : item.type === "schedule" ? "My Schedule" : "My Exchanges"); }}><span className="notification-item-icon"><Bell size={16}/></span><span><strong>{item.title}</strong><small>{item.message}</small><time>{item.created_at}</time></span></button>)}</div>}
              </div>}
            </div>

            <button
              type="button"
              className="avatar avatar-green profile-avatar-button"
              onClick={() => setActivePage("My Profile")}
              aria-label="Open my profile"
              title="My Profile"
            >
              {user.profile_photo ? <img src={API_BASE + "/" + user.profile_photo} alt="" /> : userInitials}
            </button>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <section className="page-content">

          {/* WELCOME SECTION */}
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <Sparkles size={15} />
                YOUR CAMPUS, YOUR COMMUNITY
              </div>

              <h1>
                {activePage === "Dashboard"
                  ? `Welcome, ${user.full_name.split(" ")[0]}!`
                  : activePage}
              </h1>

              <p className="page-subtitle">
                Discover skills, meet fellow students, and exchange knowledge.
              </p>
            </div>

            {activePage === "Explore Skills" && (
              <button className="primary-button" onClick={openSkillForm}>
                <Plus size={18} />
                Share a skill
              </button>
            )}
          </div>

          {/* DISCOVER STUDENTS PAGE */}
          {activePage === "Live Campus Map" ? (
            <CampusMapPage user={user} onNavigate={setActivePage} />

          ) : activePage === "Friends & Messages" ? (
            <SocialPage currentUserId={user.id} />

          ) : activePage === "Discover Students" ? (
            <DiscoverStudentsPage currentUserId={user.id} />

          ) : activePage === "My Profile" ? (
            <ProfilePage
              user={user}
              onProfileUpdated={setUser}
            />

          ) : activePage === "Explore Skills" ||
            activePage === "Share a Skill" ? (

            <SkillsPage
              user={user}
              mode={skillMode}
              onModeChange={handleSkillModeChange}
            />

          ) : activePage === "My Exchanges" ? (

            <ExchangesPage onNavigate={setActivePage} />

          ) : activePage === "My Schedule" ? (

            <SchedulePage user={user} />

          ) : activePage === "Dashboard" ? (
            <>
              {/* HERO BANNER */}
              <section className="hero-banner">
                <div className="hero-copy">
                  <span className="hero-tag">
                    <Sparkles size={14} />
                    PEER-TO-PEER LEARNING
                  </span>

                  <h2>
                    Your next skill starts
                    <br />
                    with a connection.
                  </h2>

                  <p>
                    Teach something you're great at. Learn something you've
                    always wanted to try.
                  </p>

                  <button
                    className="hero-button"
                    onClick={() => {
                      setSkillMode("browse");
                      setActivePage("Explore Skills");
                    }}
                  >
                    Find your skill match
                    <ArrowUpRight size={17} />
                  </button>
                </div>

                <div className="hero-art" aria-hidden="true">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />

                  <div className="art-card art-card-top">
                    <Code2 size={27} />
                    <span>Code</span>
                  </div>

                  <div className="art-card art-card-center">
                    <Sparkles size={36} />
                  </div>

                  <div className="art-card art-card-bottom">
                    <Palette size={27} />
                    <span>Create</span>
                  </div>

                  <div className="art-dot dot-one" />
                  <div className="art-dot dot-two" />
                </div>
              </section>

              {/* PERSONAL LEARNING OVERVIEW */}
              <section className="dashboard-overview">
                <div className="dashboard-overview-heading">
                  <div>
                    <span className="dashboard-overview-eyebrow">YOUR CAMPUS JOURNEY</span>
                    <h2>Your learning at a glance</h2>
                    <p>A quick look at your connections and skill exchanges.</p>
                  </div>
                  <button type="button" className="dashboard-overview-link" onClick={() => setActivePage("My Exchanges")}>
                    View exchanges <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="dashboard-stat-grid">
                  <article className="dashboard-stat-card">
                    <span className="dashboard-stat-icon"><BookOpen size={18} /></span>
                    <div><strong>{dashboardMyLearning.length}</strong><span>Learning goals</span></div>
                  </article>
                  <article className="dashboard-stat-card">
                    <span className="dashboard-stat-icon"><Users size={18} /></span>
                    <div><strong>{dashboardOverviewLoading ? "—" : dashboardFriends.length}</strong><span>Campus friends</span></div>
                  </article>
                  <article className="dashboard-stat-card">
                    <span className="dashboard-stat-icon"><CalendarDays size={18} /></span>
                    <div><strong>{dashboardOverviewLoading ? "—" : dashboardPending}</strong><span>Pending exchanges</span></div>
                  </article>
                  <article className="dashboard-stat-card">
                    <span className="dashboard-stat-icon"><CheckCircle2 size={18} /></span>
                    <div><strong>{dashboardOverviewLoading ? "—" : dashboardCompleted}</strong><span>Completed</span></div>
                  </article>
                </div>
                {!dashboardOverviewLoading && dashboardAccepted > 0 && (
                  <p className="dashboard-next-step"><Sparkles size={15} /> You have {dashboardAccepted} accepted exchange{dashboardAccepted === 1 ? "" : "s"} ready for your next learning session.</p>
                )}
              </section>

              {dashboardMyLearning.length > 0 && (
                <section className="dashboard-recommendations">
                  <div className="dashboard-overview-heading">
                    <div>
                      <span className="dashboard-overview-eyebrow">BASED ON YOUR LEARNING GOALS</span>
                      <h2>Recommended skill matches</h2>
                      <p>Students offering skills related to what you want to learn.</p>
                    </div>
                  </div>
                  {dashboardRecommendedSkills.length ? (
                    <div className="dashboard-recommendation-grid">
                      {dashboardRecommendedSkills.map((skill) => (
                        <article className="dashboard-recommendation-card" key={skill.id}>
                          <span className="dashboard-match-label"><Sparkles size={13} /> Match for {skill.matchedInterest}</span>
                          <h3>{skill.skill_name}</h3>
                          <p>{skill.description || "A student in your campus community can help you learn this skill."}</p>
                          <div className="dashboard-recommendation-person">
                            <span>{(skill.full_name || "S").trim().split(/\\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span>
                            <div><strong>{skill.full_name || "Campus student"}</strong><small>{skill.university || "Campus member"}</small></div>
                          </div>
                          <button type="button" className="dashboard-exchange-button" onClick={() => requestDashboardExchange(skill)} disabled={dashboardRequestedSkills.includes(Number(skill.id)) || dashboardRequestingId === Number(skill.id)}>
                            {dashboardRequestedSkills.includes(Number(skill.id)) ? "Request sent" : dashboardRequestingId === Number(skill.id) ? "Sending request..." : <>Request an exchange <ArrowUpRight size={15} /></>}
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="dashboard-recommendation-empty"><Sparkles size={18} /><span>No direct matches yet. We'll show recommendations when students share skills in your learning categories.</span></div>
                  )}
                </section>
              )}

              {/* LATEST COMMUNITY SKILLS */}
              <section className="skills-section">
                <div className="section-heading">
                  <div>
                    <h2>Recently shared skills</h2>
                    <p>The latest skill posts from your campus community.</p>
                  </div>
                  <button className="text-button" onClick={() => { setSkillMode("browse"); setActivePage("Explore Skills"); }}>
                    Explore all <ArrowUpRight size={16} />
                  </button>
                </div>
                {dashboardExchangeNotice && <div className={`dashboard-exchange-notice ${dashboardExchangeNoticeType}`} role="status">{dashboardExchangeNotice}</div>}
                {!dashboardLoading && dashboardSkills.length > 0 && (
                  <div className="database-skills-grid">
                    {dashboardSkills.slice(0, 3).map((skill) => (
                      <article className="database-skill-card" key={skill.id}>
                        <div className="database-skill-top">
                          <span className={`database-skill-type ${skill.skill_type === "offer" ? "type-offer" : "type-learn"}`}>
                            {skill.skill_type === "offer" ? "Can teach" : "Wants to learn"}
                          </span>
                          <time className="dashboard-skill-age" dateTime={skill.created_at || undefined}>
                            {formatSkillTimeAgo(skill.created_at, dashboardClock)}
                          </time>
                        </div>
                        <h3>{skill.skill_name}</h3>
                        <span className="database-skill-category">{skill.category || "General"}</span>
                        <p className="database-skill-description">{skill.description || "No description provided."}</p>
                        <div className="database-skill-student">
                          <div className="database-skill-avatar">
                            {(skill.full_name || "S").trim().split(/\\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong>{skill.full_name || "Campus student"}</strong>
                            <span>{skill.university || "Campus member"}</span>
                          </div>
                        </div>
                        {skill.skill_type === "offer" && Number(skill.user_id) !== Number(user.id) && (() => {
                          const requested = dashboardRequestedSkills.includes(Number(skill.id));
                          const requesting = dashboardRequestingId === Number(skill.id);
                          return (
                            <button
                              type="button"
                              className={`dashboard-exchange-button ${requested ? "is-requested" : ""}`}
                              onClick={() => requestDashboardExchange(skill)}
                              disabled={requested || requesting}
                            >
                              {requested ? <><CheckCircle2 size={16} /> Request sent</> : requesting ? "Sending request..." : <>Request skill exchange <ArrowUpRight size={16} /></>}
                            </button>
                          );
                        })()}
                      </article>
                    ))}
                  </div>
                )}
              </section>

            </>

          ) : (
            <div className="skills-empty">
              <Sparkles size={32} />

              <h3>{activePage} is coming soon!</h3>

              <p>
                We're building this feature for the SkillSwap Campus community.
              </p>

              <button
                className="primary-button"
                onClick={() => setActivePage("Dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          )}

        </section>
        <AppFooter onNavigate={(page) => { setActivePage(page); if (page === "Explore Skills") setSkillMode("browse"); }} />
      </main>
    </div>
  );
}

export default App;

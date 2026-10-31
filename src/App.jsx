
import { useEffect, useState } from "react";
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
} from "lucide-react";

import Auth from "./Auth";
import SkillsPage from "./SkillsPage";
import ExchangesPage from "./ExchangesPage";
import SchedulePage from "./SchedulePage";
import DiscoverStudentsPage from "./DiscoverStudentsPage";
import SocialPage from "./SocialPage";
import { apiRequest, API_BASE } from "./api";
import "./App.css";


const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Discover Students", icon: Search },
  { label: "Friends & Messages", icon: Users },
  { label: "Explore Skills", icon: Compass },
  { label: "My Exchanges", icon: ArrowUpRight },
  { label: "My Schedule", icon: CalendarDays },
  { label: "My Profile", icon: UserRound },
];

// STUDENT PROFILE COMPONENT
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
  const [notifications, setNotifications] = useState([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadDashboardSkills() {
      try {
        const result = await apiRequest("get_skills.php");
        if (active) setDashboardSkills(result.skills || []);
      } catch (error) {
        console.error("Unable to load dashboard skills:", error);
        if (active) setDashboardSkills([]);
      } finally {
        if (active) setDashboardLoading(false);
      }
    }
    loadDashboardSkills();
    return () => { active = false; };
  }, []);

  async function loadNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const result = await apiRequest("notifications.php");
      setNotifications(result.notifications || []);
    } catch (error) {
      setNotificationsError(error.message || "Unable to load notifications.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

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
        const remaining = Math.max(0, 3500 - (Date.now() - startedAt));
        if (remaining) {
          await new Promise((resolve) => window.setTimeout(resolve, remaining));
        }
        if (isMounted) {
          setUser(restoredUser);
          setAuthLoading(false);
        }
      }
    }

    initializeApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // LOG OUT.
  async function handleLogout() {
    try {
      await apiRequest("logout.php", {
        method: "POST",
      });

      setUser(null);
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



  // LOGO AND ANIMATED LOADING SCREEN.
  if (authLoading) {
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

  // SHOW LOGIN PAGE AFTER THE STARTUP SCREEN.
  if (!user) {
    return <Auth onLogin={setUser} />;
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
                {notificationsLoading ? <p className="notification-empty">Loading notifications…</p> : notificationsError ? <p className="notification-empty notification-error">{notificationsError}</p> : notifications.length === 0 ? <p className="notification-empty">You're all caught up. New friend requests, messages, and exchange activity will appear here.</p> : <div className="notification-list">{notifications.map((item) => <button type="button" className="notification-item" key={item.id} onClick={() => { setNotificationsOpen(false); setActivePage(item.type === "message" || item.type === "friend_request" ? "Friends & Messages" : "My Exchanges"); }}><span className="notification-item-icon"><Bell size={16}/></span><span><strong>{item.title}</strong><small>{item.message}</small><time>{item.created_at}</time></span></button>)}</div>}
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
          {activePage === "Friends & Messages" ? (
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

            <ExchangesPage />

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
                {dashboardLoading ? (
                  <div className="skills-empty"><p>Loading recent skill posts...</p></div>
                ) : dashboardSkills.length === 0 ? (
                  <div className="skills-empty">
                    <h3>No skill posts yet</h3>
                    <p>New posts from students will appear here when they are shared.</p>
                    <button className="primary-button" onClick={() => { setSkillMode("browse"); setActivePage("Explore Skills"); }}>Explore Skills</button>
                  </div>
                ) : (
                  <div className="database-skills-grid">
                    {dashboardSkills.slice(0, 6).map((skill) => (
                      <article className="database-skill-card" key={skill.id}>
                        <div className="database-skill-top">
                          <span className={`database-skill-type ${skill.skill_type === "offer" ? "type-offer" : "type-learn"}`}>
                            {skill.skill_type === "offer" ? "Can teach" : "Wants to learn"}
                          </span>
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

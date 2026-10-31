
import { useEffect, useState } from "react";

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
  Languages,
  Menu,
  X,
  LogOut,
  Save,
  Pencil,
} from "lucide-react";

import Auth from "./Auth";
import SkillsPage from "./SkillsPage";
import ExchangesPage from "./ExchangesPage";
import SchedulePage from "./SchedulePage";
import DiscoverStudentsPage from "./DiscoverStudentsPage";
import { apiRequest } from "./api";
import "./App.css";

const SPLASH_DURATION = 5000;

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Discover Students", icon: Search },
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

  const initials = form.full_name.trim().split(/\\s+/).filter(Boolean)
    .map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <div className="profile-page">
      <form className="profile-intro profile-modern-card" onSubmit={handleSubmit}>
        <div className="profile-large-avatar">{initials}</div>
        <div className="profile-identity">
          <h2 title={form.full_name}>{form.full_name || "Your Name"}</h2>
          {editing ? (
            <textarea className="profile-bio-editor" name="bio" value={form.bio}
              onChange={handleChange} placeholder="Write a short bio..." maxLength={500} rows={2} />
          ) : (
            <p className="profile-bio">{form.bio || "Add a short bio to introduce yourself to the campus community."}</p>
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
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashboardSkills, setDashboardSkills] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

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

  // CLEAR PREVIOUS SESSION ON EVERY FRESH APP OPEN.
  // Keep the icon-only loading screen visible for 5 seconds.
  useEffect(() => {
    let isMounted = true;
    let splashTimer;

    const startTime = Date.now();

    async function initializeApp() {
      try {
        await apiRequest("logout.php", {
          method: "POST",
        });
      } catch (error) {
        console.error(
          "Unable to clear previous login session:",
          error
        );
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(
          0,
          SPLASH_DURATION - elapsed
        );

        splashTimer = window.setTimeout(() => {
          if (isMounted) {
            setUser(null);
            setAuthLoading(false);
          }
        }, remaining);
      }
    }

    initializeApp();

    return () => {
      isMounted = false;

      if (splashTimer) {
        window.clearTimeout(splashTimer);
      }
    };
  }, []);

  // ATTEMPT LOGOUT WHEN THE APP IS CLOSED OR REFRESHED.
  useEffect(() => {
    if (!user) return;

    function logoutOnExit() {
      const logoutUrl = "/backend/logout.php";

      if (navigator.sendBeacon) {
        const payload = new Blob([], {
          type: "application/x-www-form-urlencoded",
        });

        navigator.sendBeacon(logoutUrl, payload);
      } else {
        fetch(logoutUrl, {
          method: "POST",
          credentials: "include",
          keepalive: true,
        }).catch(() => {});
      }
    }

    window.addEventListener("pagehide", logoutOnExit);

    return () => {
      window.removeEventListener("pagehide", logoutOnExit);
    };
  }, [user]);

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
      setSearch("");

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

          <div className="splash-loader" aria-label="Loading">
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
              <span>{user.university || "Campus Member"}</span>
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
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={20} />
              <span />
            </button>

            <button
              type="button"
              className="avatar avatar-green profile-avatar-button"
              onClick={() => setActivePage("My Profile")}
              aria-label="Open my profile"
              title="My Profile"
            >
              {userInitials}
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
          {activePage === "Discover Students" ? (
            <DiscoverStudentsPage />

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

              {/* FOOTER */}
              <footer className="footer">
                <div className="footer-brand">
                  <strong>SkillSwap Campus</strong>
                  <span>Learn together. Grow together.</span>
                </div>
                <span className="footer-copy">A campus community built on sharing knowledge.</span>
              </footer>
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
      </main>
    </div>
  );
}

export default App;

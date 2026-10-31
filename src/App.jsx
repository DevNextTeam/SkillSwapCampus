
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Search,
  Compass,
  CalendarDays,
  UserRound,
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

// Temporary dashboard recommendations removed; dashboard uses live skill posts.
const skills = [
  {
    title: "Web Development",
    category: "Programming",
    teacher: "Alex Morgan",
    initials: "AM",
    color: "blue",
    level: "Intermediate",
    icon: Code2,
  },
  {
    title: "UI/UX Design",
    category: "Creative Arts",
    teacher: "Jamie Lee",
    initials: "JL",
    color: "purple",
    level: "Beginner friendly",
    icon: Palette,
  },
  {
    title: "Japanese Language",
    category: "Languages",
    teacher: "Taylor Kim",
    initials: "TK",
    color: "orange",
    level: "All levels",
    icon: Languages,
  },
];

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
    email: user.email || "",
    university: user.university || "",
    course: user.course || "",
    year_level: user.year_level || "",
    bio: user.bio || "",
  });

  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest("update_profile.php", {
        method: "POST",
        body: JSON.stringify({
          full_name: form.full_name,
          university: form.university,
          course: form.course,
          year_level: form.year_level,
          bio: form.bio,
        }),
      });

      onProfileUpdated(result.user);

      setForm((previous) => ({
        ...previous,
        ...result.user,
      }));

      setMessage("Your profile has been updated successfully!");
      setMessageType("success");
      setEditing(false);
    } catch (error) {
      setMessage(error.message || "Unable to save your profile.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  const initials = form.full_name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-intro">
        <div className="profile-large-avatar">
          {initials || "ST"}
        </div>

        <div>
          <h2>{form.full_name || "Your Name"}</h2>
          <p>{form.university || "Add your university"}</p>

          <span className="profile-status">
            <span className="status-dot" />
            Campus Member
          </span>
        </div>
        <button type="button" className="primary-button profile-edit-button" onClick={() => setEditing(true)} disabled={editing}>
          <Pencil size={16} /> Edit Profile
        </button>
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-form-heading">
          <div>
            <h2>Personal Information</h2>
            <p>Keep your student profile updated.</p>
          </div>

          <UserRound size={23} />
        </div>

        <div className="profile-fields">
          <div className="profile-field">
            <label htmlFor="full_name">Full Name</label>

            <input
              disabled={!editing}
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>

          <div className="profile-field">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              disabled
            />

            <small>Your email address cannot be changed here.</small>
          </div>

          <div className="profile-field">
            <label htmlFor="university">University</label>

            <input
              disabled={!editing}
              id="university"
              name="university"
              type="text"
              placeholder="Enter your university"
              value={form.university}
              onChange={handleChange}
              maxLength={150}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="course">Course / Program</label>

            <input
              disabled={!editing}
              id="course"
              name="course"
              type="text"
              placeholder="e.g. Bachelor of Science in IT"
              value={form.course}
              onChange={handleChange}
              maxLength={100}
            />
          </div>

          <div className="profile-field">
            <label htmlFor="year_level">Year Level</label>

            <select
              disabled={!editing}
              id="year_level"
              name="year_level"
              value={form.year_level}
              onChange={handleChange}
            >
              <option value="">Select your year level</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="5th Year">5th Year</option>
              <option value="Graduate Student">Graduate Student</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="profile-field profile-field-full">
            <label htmlFor="bio">About Me</label>

            <textarea
              disabled={!editing}
              id="bio"
              name="bio"
              placeholder="Tell other students about yourself, your interests, and the skills you want to learn..."
              value={form.bio}
              onChange={handleChange}
              maxLength={2000}
              rows={5}
            />

            <small>{form.bio.length}/2000 characters</small>
          </div>
        </div>

        {message && (
          <div className={`profile-message ${messageType}`}>
            {message}
          </div>
        )}

        {editing && (
          <div className="profile-form-actions">
            <button type="button" className="skill-cancel-button" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button profile-save-button" disabled={saving}>
              <Save size={17} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// MAIN APPLICATION
function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [skillMode, setSkillMode] = useState("browse");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [requested, setRequested] = useState([]);

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
      setRequested([]);
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

  // FILTER TEMPORARY DASHBOARD RECOMMENDATIONS.
  const filteredSkills = skills.filter((skill) =>
    `${skill.title} ${skill.category} ${skill.teacher}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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

              {/* STATISTICS */}
              <section className="stats-grid">
                <article className="stat-card">
                  <div className="stat-icon stat-blue">
                    <Compass size={20} />
                  </div>

                  <span>Skills to explore</span>
                  <strong>24</strong>
                  <small>Discover your next interest</small>
                </article>

                <article className="stat-card">
                  <div className="stat-icon stat-purple">
                    <CalendarDays size={20} />
                  </div>

                  <span>Upcoming sessions</span>
                  <strong>03</strong>
                  <small>Keep learning on schedule</small>
                </article>

                <article className="stat-card">
                  <div className="stat-icon stat-orange">
                    <Sparkles size={20} />
                  </div>

                  <span>Learning credits</span>
                  <strong>120</strong>
                  <small>Earn through skill exchanges</small>
                </article>
              </section>

              {/* RECOMMENDED SKILLS */}
              <section className="skills-section">
                <div className="section-heading">
                  <div>
                    <h2>Skills you might love</h2>

                    <p>
                      Find a student who can teach you something new.
                    </p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => {
                      setSkillMode("browse");
                      setActivePage("Explore Skills");
                    }}
                  >
                    View all <ArrowUpRight size={16} />
                  </button>
                </div>

                <div className="search-bar">
                  <Search size={19} />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search skills, categories, or students..."
                    aria-label="Search skills"
                  />
                </div>

                <div className="skills-grid">
                  {filteredSkills.map((skill) => {
                    const Icon = skill.icon;
                    const isRequested = requested.includes(skill.title);

                    return (
                      <article
                        className="skill-card"
                        key={skill.title}
                      >
                        <div className={`skill-art skill-${skill.color}`}>
                          <div className="skill-art-icon">
                            <Icon size={29} />
                          </div>

                          <span>{skill.category}</span>
                        </div>

                        <div className="skill-card-body">
                          <span className="skill-level">
                            {skill.level}
                          </span>

                          <h3>{skill.title}</h3>

                          <div className="teacher-row">
                            <div className={`avatar avatar-${skill.color}`}>
                              {skill.initials}
                            </div>

                            <span>{skill.teacher}</span>
                          </div>

                          <button
                            className={
                              isRequested
                                ? "requested-button"
                                : "request-button"
                            }
                            onClick={() =>
                              setRequested((previous) =>
                                isRequested
                                  ? previous.filter(
                                      (title) => title !== skill.title
                                    )
                                  : [...previous, skill.title]
                              )
                            }
                          >
                            {isRequested
                              ? "Request saved ✓"
                              : "Request exchange"}

                            {!isRequested && <ArrowUpRight size={16} />}
                          </button>
                        </div>
                      </article>
                    );
                  })}

                  {filteredSkills.length === 0 && (
                    <div className="empty-state">
                      <Search size={26} />

                      <h3>No matching skills found</h3>

                      <p>Try a different keyword.</p>
                    </div>
                  )}
                </div>
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

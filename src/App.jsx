
import { useState } from "react";
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
  Clock3,
  Menu,
  X,
} from "lucide-react";
import "./App.css";

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
  { label: "Explore Skills", icon: Compass },
  { label: "My Exchanges", icon: ArrowUpRight },
  { label: "My Schedule", icon: CalendarDays },
  { label: "My Profile", icon: UserRound },
];

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [requested, setRequested] = useState([]);

  const filteredSkills = skills.filter((skill) =>
    `${skill.title} ${skill.category} ${skill.teacher}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={23} />
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

        <div className="sidebar-label">WORKSPACE</div>
        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${
                activePage === label ? "nav-active" : ""
              }`}
              onClick={() => {
                setActivePage(label);
                setMenuOpen(false);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <Sparkles size={20} />
            <h3>Learn something new</h3>
            <p>Share what you know. Discover what you can learn.</p>
            <button onClick={() => setActivePage("Explore Skills")}>
              Explore skills <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="profile-mini">
            <div className="avatar avatar-green">ST</div>
            <div className="profile-mini-info">
              <strong>Student User</strong>
              <span>Campus Member</span>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="main-content">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" aria-label="Notifications">
              <Bell size={20} />
              <span />
            </button>
            <div className="avatar avatar-green">ST</div>
          </div>
        </header>

        <section className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                <Sparkles size={15} /> YOUR CAMPUS, YOUR COMMUNITY
              </div>
              <h1>
                {activePage === "Dashboard"
                  ? "Learn together, grow together."
                  : activePage}
              </h1>
              <p className="page-subtitle">
                Discover skills, meet fellow students, and exchange knowledge.
              </p>
            </div>
            <button
              className="primary-button"
              onClick={() => setActivePage("Share a Skill")}
            >
              <Plus size={18} /> Share a skill
            </button>
          </div>

          <section className="hero-banner">
            <div className="hero-copy">
              <span className="hero-tag">
                <Sparkles size={14} /> PEER-TO-PEER LEARNING
              </span>
              <h2>Your next skill starts<br />with a connection.</h2>
              <p>
                Teach something you're great at. Learn something you've
                always wanted to try.
              </p>
              <button
                className="hero-button"
                onClick={() => setActivePage("Explore Skills")}
              >
                Find your skill match <ArrowUpRight size={17} />
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

          <section className="stats-grid">
            <article className="stat-card">
              <div className="stat-icon stat-blue"><Compass size={20} /></div>
              <span>Skills to explore</span>
              <strong>24</strong>
              <small>Discover your next interest</small>
            </article>
            <article className="stat-card">
              <div className="stat-icon stat-purple"><CalendarDays size={20} /></div>
              <span>Upcoming sessions</span>
              <strong>03</strong>
              <small>Keep learning on schedule</small>
            </article>
            <article className="stat-card">
              <div className="stat-icon stat-orange"><Sparkles size={20} /></div>
              <span>Learning credits</span>
              <strong>120</strong>
              <small>Earn through skill exchanges</small>
            </article>
          </section>

          <section className="skills-section">
            <div className="section-heading">
              <div>
                <h2>
                  {activePage === "Explore Skills"
                    ? "Explore available skills"
                    : "Skills you might love"}
                </h2>
                <p>Find a student who can teach you something new.</p>
              </div>
              <button
                className="text-button"
                onClick={() => setActivePage("Explore Skills")}
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
                  <article className="skill-card" key={skill.title}>
                    <div className={`skill-art skill-${skill.color}`}>
                      <div className="skill-art-icon">
                        <Icon size={29} />
                      </div>
                      <span>{skill.category}</span>
                    </div>
                    <div className="skill-card-body">
                      <span className="skill-level">{skill.level}</span>
                      <h3>{skill.title}</h3>
                      <div className="teacher-row">
                        <div className={`avatar avatar-${skill.color}`}>
                          {skill.initials}
                        </div>
                        <span>{skill.teacher}</span>
                      </div>
                      <button
                        className={isRequested ? "requested-button" : "request-button"}
                        onClick={() =>
                          setRequested((previous) =>
                            isRequested
                              ? previous.filter((title) => title !== skill.title)
                              : [...previous, skill.title]
                          )
                        }
                      >
                        {isRequested ? "Request saved ✓" : "Request exchange"}
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

          <footer className="footer">
            <span>SkillSwap Campus</span>
            <span>Built for students, powered by sharing.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;

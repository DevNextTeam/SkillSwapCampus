
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { apiRequest, API_BASE } from "./api";
import "./DiscoverStudentsPage.css";

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";
}

export default function DiscoverStudentsPage({ currentUserId }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [messageText, setMessageText] = useState("");
  const [conversation, setConversation] = useState([]);

  async function openStudent(student) {
    setSelected(student); setShowProfilePage(false); setDetailLoading(true); setNotice(""); setConversation([]);
    try { const result = await apiRequest(`get_student_profile.php?id=${student.id}`); setSelected(result.student); }
    catch (err) { setNotice(err.message || "Unable to load profile."); }
    finally { setDetailLoading(false); }
  }

  async function friendAction(action) {
    try { const result = await apiRequest("friend_request.php", { method:"POST", body:JSON.stringify({ user_id:selected.id, action }) }); setNotice(result.message); const refreshed = await apiRequest(`get_student_profile.php?id=${selected.id}`); setSelected(refreshed.student); }
    catch (err) { setNotice(err.message || "Unable to update friend request."); }
  }

  async function loadConversation() {
    try { const result = await apiRequest(`messages.php?user_id=${selected.id}`); setConversation(result.messages || []); }
    catch (err) { setNotice(err.message || "Unable to load messages."); }
  }

  async function sendMessage(event) {
    event.preventDefault(); if (!messageText.trim()) return;
    try { await apiRequest("messages.php", { method:"POST", body:JSON.stringify({ user_id:selected.id, body:messageText.trim() }) }); setMessageText(""); await loadConversation(); }
    catch (err) { setNotice(err.message || "Unable to send message."); }
  }

  async function loadStudents() {
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest("get_students.php");

      setStudents(result.students || []);
    } catch (err) {
      setError(err.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) loadStudents(); });
    return () => { active = false; };
  }, []);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return students.filter((student) => {
      const offered = student.skills_offered || [];
      const wanted = student.skills_wanted || [];

      const matchesSearch = [
        student.full_name,
        student.university,
        student.course,
        student.year_level,
        student.bio,
        ...offered,
        ...wanted,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(keyword);

      const matchesFilter =
        filter === "all" ||
        (filter === "offering" && offered.length > 0) ||
        (filter === "learning" && wanted.length > 0);

      return matchesSearch && matchesFilter;
    });
  }, [students, search, filter]);

  return (
    <div className="discover-page">
      {!showProfilePage && <>
      <div className="discover-heading">
        <div>
          <div className="discover-eyebrow">
            <Sparkles size={15} />
            CAMPUS CONNECTIONS
          </div>

          <h2>Meet your fellow students</h2>

          <p>
            Find people to learn from, share your knowledge,
            and build new connections.
          </p>
        </div>

        <button
          className="discover-refresh"
          onClick={loadStudents}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="discover-toolbar">
        <div className="discover-search">
          <Search size={19} />

          <input
            type="search"
            placeholder="Search students, courses, or skills..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="discover-filters">
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            All students
          </button>

          <button
            className={filter === "offering" ? "active" : ""}
            onClick={() => setFilter("offering")}
          >
            Offering skills
          </button>

          <button
            className={filter === "learning" ? "active" : ""}
            onClick={() => setFilter("learning")}
          >
            Want to learn
          </button>
        </div>
      </div>

      <div className="discover-results-heading">
        <div>
          <h3>Student community</h3>
          <p>
            {loading
              ? "Loading student profiles..."
              : `${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        <Users size={22} />
      </div>

      {loading ? (
        <div className="discover-empty">
          <RefreshCw size={28} />
          <h3>Loading students</h3>
          <p>Please wait while we find your campus community.</p>
        </div>
      ) : error ? (
        <div className="discover-empty discover-error">
          <h3>We couldn't load students</h3>
          <p>{error}</p>
          <button onClick={loadStudents}>Try again</button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="discover-empty">
          <UserRound size={30} />
          <h3>No students found</h3>
          <p>
            Try another search or change your filter.
          </p>
        </div>
      ) : (
        <div className="discover-grid">
          {filteredStudents.map((student) => (
            <article className="student-card student-card-clickable" key={student.id} role="button" tabIndex={0} onClick={() => openStudent(student)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); openStudent(student); } }}>
              <div className="student-card-top">
                <div className="student-avatar">{student.profile_photo ? <img src={`${API_BASE}/${student.profile_photo}`} alt="" /> : getInitials(student.full_name)}</div>

                <span className="student-member-label">
                  Campus member
                </span>
              </div>

              <div className="student-card-info">
                <h3>{student.full_name}</h3>

                <p className="student-university">
                  <GraduationCap size={16} />
                  {student.university || "University not provided"}
                </p>

                {(student.course || student.year_level) && (
                  <p className="student-course">
                    {[student.course, student.year_level]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}

                {student.bio?.trim() && (
                  <p className="student-bio">{student.bio}</p>
                )}

                <div className="student-skills-group">
                  <h4>
                    <Sparkles size={15} />
                    Skills they offer
                  </h4>

                  <div className="student-skill-tags">
                    {student.skills_offered?.length ? (
                      student.skills_offered.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))
                    ) : (
                      <small>No skills offered yet</small>
                    )}
                  </div>
                </div>

                <div className="student-skills-group wanted">
                  <h4>
                    <BookOpen size={15} />
                    Skills they want to learn
                  </h4>

                  <div className="student-skill-tags">
                    {student.skills_wanted?.length ? (
                      student.skills_wanted.map((skill) => (
                        <span key={skill}>{skill}</span>
                      ))
                    ) : (
                      <small>No learning goals added yet</small>
                    )}
                  </div>
                </div>
                <button className="student-card-footer" type="button" onClick={(event) => { event.stopPropagation(); openStudent(student); }}>View profile <span aria-hidden="true">→</span></button>
              </div>
            </article>
          ))}
        </div>
      )}
      </>}
      {selected && !showProfilePage && (
        <div className="student-quick-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setConversation([]); } }}>
          <section className="student-quick-panel" role="dialog" aria-modal="true" aria-label={`Connect with ${selected.full_name}`}>
            <button className="student-quick-close" type="button" onClick={() => { setSelected(null); setConversation([]); }}>×</button>
            {detailLoading ? <div className="student-profile-loading">Loading student profile...</div> : <>
              <div className="student-quick-person">
                <div className="student-avatar student-profile-avatar">{selected.profile_photo ? <img src={`${API_BASE}/${selected.profile_photo}`} alt={selected.full_name} /> : getInitials(selected.full_name)}</div>
                <div><span className="profile-member-pill">CAMPUS MEMBER</span><h2>{selected.full_name}</h2><p>{[selected.university, selected.course, selected.year_level].filter(Boolean).join(" · ") || "Student member"}</p></div>
              </div>
              <div className="student-quick-actions">
                {!selected.friend_status || selected.friend_status.status === "declined" ? <button type="button" onClick={() => friendAction("send")}>Add friend</button> : selected.friend_status.status === "pending" && Number(selected.friend_status.sender_id) === Number(currentUserId) ? <span className="student-request-status">Request sent · Pending</span> : selected.friend_status.status === "pending" ? <button type="button" onClick={() => friendAction("accept")}>Accept request</button> : <span className="student-request-status">Friends</span>}
                <button type="button" className="secondary" disabled={selected.friend_status?.status !== "accepted"} onClick={loadConversation}>Send message</button>
                <button type="button" className="tertiary" onClick={() => setShowProfilePage(true)}>View profile</button>
              </div>
              {notice && <p className="student-profile-notice">{notice}</p>}
              {selected.friend_status?.status === "accepted" && <div className="student-chat">
                <div className="student-chat-title">PRIVATE MESSAGES</div>
                <div className="student-chat-history">{conversation.length ? conversation.map(item => <p className={Number(item.sender_id) === Number(currentUserId) ? "sent" : "received"} key={item.id}>{item.body}<small>{item.created_at}</small></p>) : <p className="student-chat-empty">Your conversation with {selected.full_name} will appear here.</p>}</div>
                <form onSubmit={sendMessage}><input value={messageText} onChange={event => setMessageText(event.target.value)} placeholder="Write a message..." maxLength={4000} /><button type="submit">Send</button></form>
              </div>}
            </>}
          </section>
        </div>
      )}
      {selected && showProfilePage && (
        <section className="student-profile-page">
          <button className="student-profile-back" type="button" onClick={() => { setSelected(null); setShowProfilePage(false); setConversation([]); setNotice(""); }}>
            <span aria-hidden="true">←</span> Back to students
          </button>
          {detailLoading ? (
            <div className="student-profile-loading"><span className="profile-loading-dot" />Loading student profile...</div>
          ) : (
            <article className="student-profile-card">
              <div className="student-profile-cover">
                <span>SKILLSWAP CAMPUS</span>
                <span className="profile-cover-mark"><Sparkles size={20} /></span>
              </div>
              <div className="student-profile-main">
                <div className="student-profile-header">
                  <div className="student-avatar student-profile-avatar">
                    {selected.profile_photo ? <img src={`${API_BASE}/${selected.profile_photo}`} alt={selected.full_name} /> : getInitials(selected.full_name)}
                  </div>
                  <div className="student-profile-identity">
                    <span className="profile-member-pill">CAMPUS MEMBER</span>
                    <h2>{selected.full_name}</h2>
                    <p>{[selected.university, selected.course, selected.year_level].filter(Boolean).join(" · ") || "Student member"}</p>
                  </div>
                  <div className="student-profile-actions">
                    {!selected.friend_status || selected.friend_status.status === "declined" ? (
                      <button type="button" onClick={() => friendAction("send")}>Add friend</button>
                    ) : selected.friend_status.status === "pending" && Number(selected.friend_status.sender_id) === Number(currentUserId) ? (
                      <span className="student-request-status">Request sent · Pending</span>
                    ) : selected.friend_status.status === "pending" ? (
                      <button type="button" onClick={() => friendAction("accept")}>Accept request</button>
                    ) : (
                      <span className="student-request-status">Friends</span>
                    )}
                    <button type="button" className="secondary" disabled={selected.friend_status?.status !== "accepted"} onClick={loadConversation}>Send message</button>
                  </div>
                </div>
                {selected.bio?.trim() && <div className="student-profile-about"><h3>About</h3><p>{selected.bio}</p></div>}
                {selected.skills?.length > 0 && (
                  <section className="student-profile-skills-section">
                    <h3>Skills</h3>
                    <div className="student-profile-skills-list">
                      {selected.skills.map((skill) => (
                        <article className="student-profile-skill" key={skill.id}>
                          <div><span className={skill.skill_type === "offer" ? "skill-type-offer" : "skill-type-learn"}>{skill.skill_type === "offer" ? "Offers" : "Wants to learn"}</span><h4>{skill.skill_name}</h4></div>
                          {skill.category && <span className="student-profile-skill-category">{skill.category}</span>}
                          {skill.description?.trim() && <p>{skill.description}</p>}
                        </article>
                      ))}
                    </div>
                  </section>
                )}
                {notice && <p className="student-profile-notice">{notice}</p>}
              </div>
            </article>
          )}
        </section>
      )}
    </div>
  );
}

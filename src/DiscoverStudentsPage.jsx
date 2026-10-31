
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
import { apiRequest } from "./api";
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
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [messageText, setMessageText] = useState("");
  const [conversation, setConversation] = useState([]);

  async function openStudent(student) {
    setSelected(student); setDetailLoading(true); setNotice(""); setConversation([]);
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

  useEffect(() => {\n    let active = true;\n    Promise.resolve().then(() => { if (active) loadStudents(); });\n    return () => { active = false; };\n  }, []);

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
            <article className="student-card student-card-clickable" key={student.id} role="button" tabIndex={0} onClick={() => openStudent(student)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openStudent(student); } }}>
              <div className="student-card-top">
                <div className="student-avatar">{student.profile_photo ? <img src={`http://10.0.9.203/skillswap-campus/backend/${student.profile_photo}`} alt="" /> : getInitials(student.full_name)}</div>

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

                <p className="student-bio">
                  {student.bio && <>{student.bio}</>}
                </p>

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
              </div>
            </article>
          ))}
        </div>
      )}
      {selected && <div className="student-profile-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}>
        <section className="student-profile-modal" role="dialog" aria-modal="true" aria-label="Student profile">
          <button className="student-profile-close" onClick={() => setSelected(null)} aria-label="Close profile">×</button>
          {detailLoading ? <p>Loading profile...</p> : <>
            <div className="student-profile-header"><div className="student-avatar student-profile-avatar">{selected.profile_photo ? <img src={`http://10.0.9.203/skillswap-campus/backend/${selected.profile_photo}`} alt="" /> : getInitials(selected.full_name)}</div><div><h2>{selected.full_name}</h2><p>{[selected.university,selected.course,selected.year_level].filter(Boolean).join(" · ")}</p></div></div>
            {selected.bio && <p className="student-profile-bio">{selected.bio}</p>}
            <div className="student-profile-actions">
              {!selected.friend_status ? <button onClick={() => friendAction("send")}>Add friend</button> :
                selected.friend_status.status === "accepted" ? <button onClick={loadConversation}>Open messages</button> :
                selected.friend_status.status === "pending" && Number(selected.friend_status.sender_id) === Number(currentUserId) ? <span>Request sent · Pending</span> :
                selected.friend_status.status === "pending" ? <><button onClick={() => friendAction("accept")}>Accept request</button><button className="secondary" onClick={() => friendAction("decline")}>Decline</button></> :
                <button onClick={() => friendAction("send")}>Send friend request</button>}
            </div>
            {notice && <p className="student-profile-notice">{notice}</p>}
            <h3>Skills</h3><div className="student-profile-skills">{(selected.skills || []).map(skill => <div key={skill.id}><strong>{skill.skill_name}</strong><span>{skill.skill_type === "offer" ? "Can teach" : "Wants to learn"}</span>{skill.description && <p>{skill.description}</p>}{skill.skill_type === "offer" && <button onClick={async () => { try { const result = await apiRequest("request_exchange.php", { method:"POST", body:JSON.stringify({skill_id:skill.id}) }); setNotice(result.message); } catch(err) { setNotice(err.message); } }}>Request exchange</button>}</div>)}</div>
            {selected.friend_status?.status === "accepted" && <div className="student-chat"><h3>Messages</h3><div className="student-chat-history">{conversation.map(item => <p className={Number(item.sender_id)===Number(currentUserId)?"sent":"received"} key={item.id}>{item.body}<small>{item.created_at}</small></p>)}</div><form onSubmit={sendMessage}><input value={messageText} onChange={event=>setMessageText(event.target.value)} placeholder="Write a message..." maxLength={4000}/><button type="submit">Send</button></form></div>}
          </>}
        </section>
      </div>}
    </div>
  );
}

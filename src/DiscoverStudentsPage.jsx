
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

export default function DiscoverStudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    loadStudents();
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
            <article className="student-card" key={student.id}>
              <div className="student-card-top">
                <div className="student-avatar">
                  {getInitials(student.full_name)}
                </div>

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
                  {student.bio || "This student hasn't added a bio yet."}
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
    </div>
  );
}


import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  BookOpen,
  GraduationCap,
  RefreshCw,
  X,
  Send,
  Pencil,
  Trash2,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

import { apiRequest } from "./api";

function SkillsPage({ user, mode = "browse", onModeChange }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [editingSkill, setEditingSkill] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [requestingId, setRequestingId] = useState(null);
  const [requestedSkills, setRequestedSkills] = useState([]);

  const [form, setForm] = useState({
    skill_name: "",
    category: "",
    skill_type: "offer",
    description: "",
  });

  async function loadSkills() {
    setLoading(true);

    try {
     const result = await apiRequest("get_skills.php");

    const loadedSkills = result.skills || [];

    setSkills(loadedSkills);

    setRequestedSkills(
      loadedSkills
        .filter((skill) => Number(skill.has_requested) === 1)
        .map((skill) => Number(skill.id))
    );
    } catch (error) {
      setMessage(error.message || "Unable to load skills.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) loadSkills(); });
    return () => { active = false; };
  }, []);

  function resetForm() {
    setForm({
      skill_name: "",
      category: "",
      skill_type: "offer",
      description: "",
    });

    setEditingSkill(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function startEditing(skill) {
    setEditingSkill(skill);

    setForm({
      skill_name: skill.skill_name || "",
      category: skill.category || "",
      skill_type: skill.skill_type || "offer",
      description: skill.description || "",
    });

    setMessage("");
    setMessageType("");
  }

  function cancelForm() {
    resetForm();
    setMessage("");
    setMessageType("");

    if (onModeChange) {
      onModeChange("browse");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving) return;

    setSaving(true);
    setMessage("");
    setMessageType("");

    try {
      const endpoint = editingSkill
        ? "update_skill.php"
        : "add_skill.php";

      const requestBody = editingSkill
        ? { ...form, id: editingSkill.id }
        : form;

      const result = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      setMessage(
        result.message ||
          (editingSkill
            ? "Your skill has been updated!"
            : "Your skill has been added!")
      );

      setMessageType("success");

      resetForm();
      await loadSkills();

      if (onModeChange) {
        onModeChange("browse");
      }
    } catch (error) {
      setMessage(error.message || "Unable to save your skill.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(skill) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${skill.skill_name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(skill.id);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest("delete_skill.php", {
        method: "POST",
        body: JSON.stringify({ id: skill.id }),
      });

      setMessage(result.message || "Skill deleted successfully!");
      setMessageType("success");

      await loadSkills();
    } catch (error) {
      setMessage(error.message || "Unable to delete this skill.");
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  }

  // Send an actual exchange request to another student's skill post.
  async function handleRequestExchange(skill) {
    if (requestingId !== null) return;

    setRequestingId(skill.id);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest("request_exchange.php", {
        method: "POST",
        body: JSON.stringify({
          skill_id: skill.id,
        }),
      });

      setRequestedSkills((previous) => [
        ...previous,
        Number(skill.id),
      ]);

      setMessage(
        result.message || "Exchange request sent successfully!"
      );
      setMessageType("success");

    } catch (error) {
      setMessage(
        error.message || "Unable to send your exchange request."
      );
      setMessageType("error");
    } finally {
      setRequestingId(null);
    }
  }

  const isFormOpen = mode === "create" || editingSkill !== null;

  const filteredSkills = skills.filter((skill) => {
    const searchText = [
      skill.skill_name,
      skill.category,
      skill.description,
      skill.full_name,
      skill.university,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchText.includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" || skill.skill_type === filter;

    return matchesSearch && matchesFilter;
  });

  const categories = [
    "Programming",
    "Creative Arts",
    "Languages",
    "Academic",
    "Business",
    "Music",
    "Sports",
    "Other",
  ];

  return (
    <div className="skills-page">
      <div className="skills-page-heading">
        <div>
          <span className="skills-page-eyebrow">
            <BookOpen size={15} />
            CAMPUS KNOWLEDGE EXCHANGE
          </span>

          <h2>
            {editingSkill
              ? "Edit your skill"
              : mode === "create"
                ? "Share your knowledge"
                : "Discover campus skills"}
          </h2>

          <p>
            {isFormOpen
              ? "Tell other students what you can teach or what you want to learn."
              : "Find students who can teach you something new."}
          </p>
        </div>

        {mode === "browse" && !editingSkill && (
          <button
            className="primary-button"
            onClick={() => {
              setMessage("");
              setMessageType("");
              onModeChange?.("create");
            }}
          >
            <Plus size={18} />
            Add a skill
          </button>
        )}
      </div>

      {message && (
        <div className={`profile-message ${messageType}`}>
          {message}
        </div>
      )}

      {isFormOpen ? (
        <form className="skill-form-card" onSubmit={handleSubmit}>
          <div className="skill-form-title">
            <div className="skill-form-icon">
              <GraduationCap size={23} />
            </div>

            <div>
              <h3>
                {editingSkill
                  ? "Update your skill post"
                  : "Create a skill post"}
              </h3>

              <p>
                Your post will be visible to other logged-in students.
              </p>
            </div>
          </div>

          <div className="skill-form-fields">
            <div className="skill-form-field">
              <label htmlFor="skill_name">Skill name *</label>

              <input
                id="skill_name"
                name="skill_name"
                value={form.skill_name}
                onChange={handleChange}
                placeholder="e.g. Web Development"
                maxLength={100}
                required
              />
            </div>

            <div className="skill-form-field">
              <label htmlFor="category">Category</label>

              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
              >
                <option value="">Choose a category</option>

                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="skill-form-field skill-form-full">
              <label>What would you like to do? *</label>

              <div className="skill-type-options">
                <label
                  className={`skill-type-option ${
                    form.skill_type === "offer" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="skill_type"
                    value="offer"
                    checked={form.skill_type === "offer"}
                    onChange={handleChange}
                  />

                  <span>
                    <strong>I can teach this</strong>
                    <small>Share a skill you already know.</small>
                  </span>
                </label>

                <label
                  className={`skill-type-option ${
                    form.skill_type === "learn" ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="skill_type"
                    value="learn"
                    checked={form.skill_type === "learn"}
                    onChange={handleChange}
                  />

                  <span>
                    <strong>I want to learn this</strong>
                    <small>Find someone who can teach you.</small>
                  </span>
                </label>
              </div>
            </div>

            <div className="skill-form-field skill-form-full">
              <label htmlFor="description">Description</label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your experience or what you hope to learn..."
                maxLength={5000}
                rows={5}
              />

              <small>{form.description.length}/5000 characters</small>
            </div>
          </div>

          <div className="skill-form-actions">
            <button
              type="button"
              className="skill-cancel-button"
              onClick={cancelForm}
              disabled={saving}
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              <Send size={17} />

              {saving
                ? "Saving..."
                : editingSkill
                  ? "Save Changes"
                  : "Publish Skill"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="skills-discovery-toolbar">
            <div className="skills-search">
              <Search size={19} />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search skills, students, or categories..."
                aria-label="Search skills"
              />
            </div>

            <select
              className="skills-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter skills"
            >
              <option value="all">All posts</option>
              <option value="offer">Skills to learn from</option>
              <option value="learn">Skills students want to learn</option>
            </select>

            <button
              className="skills-refresh-button"
              onClick={loadSkills}
              disabled={loading}
              title="Refresh skills"
              aria-label="Refresh skills"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="skills-results-heading">
            <h3>Campus skill posts</h3>
            <span>{filteredSkills.length} posts</span>
          </div>

          {loading ? (
            <div className="skills-empty">
              <RefreshCw size={25} />
              <p>Loading campus skills...</p>
            </div>
          ) : filteredSkills.length === 0 ? (
            <div className="skills-empty">
              <BookOpen size={32} />

              <h3>No skills found yet</h3>

              <p>
                Try another search or be the first student to publish a skill.
              </p>

              <button
                className="primary-button"
                onClick={() => onModeChange?.("create")}
              >
                <Plus size={17} />
                Add the first skill
              </button>
            </div>
          ) : (
            <div className="database-skills-grid">
              {filteredSkills.map((skill) => {
                const isMine =
                  Number(skill.user_id) === Number(user.id);

                const hasRequested =
                  requestedSkills.includes(Number(skill.id));

                const isRequesting =
                  requestingId === skill.id;

                return (
                  <article
                    className="database-skill-card"
                    key={skill.id}
                  >
                    <div className="database-skill-top">
                      <span
                        className={`database-skill-type ${
                          skill.skill_type === "offer"
                            ? "type-offer"
                            : "type-learn"
                        }`}
                      >
                        {skill.skill_type === "offer"
                          ? "Can teach"
                          : "Wants to learn"}
                      </span>

                      {isMine && (
                        <span className="my-skill-label">
                          Your post
                        </span>
                      )}
                    </div>

                    <h3>{skill.skill_name}</h3>

                    <span className="database-skill-category">
                      {skill.category || "General"}
                    </span>

                    <p className="database-skill-description">
                      {skill.description || "No description provided."}
                    </p>

                    <div className="database-skill-student">
                      <div className="database-skill-avatar">
                        {(skill.full_name || "S")
                          .trim()
                          .split(/\s+/)
                          .filter(Boolean)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>{skill.full_name}</strong>

                        <span>
                          {skill.university || "Campus Member"}
                        </span>
                      </div>
                    </div>

                    {isMine ? (
                      <div className="skill-owner-actions">
                        <button
                          type="button"
                          className="skill-edit-button"
                          onClick={() => startEditing(skill)}
                        >
                          <Pencil size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="skill-delete-button"
                          onClick={() => handleDelete(skill)}
                          disabled={deletingId === skill.id}
                        >
                          <Trash2 size={15} />
                          {deletingId === skill.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    ) : skill.skill_type === "offer" ? (
                      <button
                        type="button"
                        className={
                          hasRequested
                            ? "requested-button"
                            : "request-button"
                        }
                        onClick={() => handleRequestExchange(skill)}
                        disabled={hasRequested || isRequesting}
                      >
                        {hasRequested ? (
                          <>
                            <CheckCircle2 size={16} />
                            Request Sent
                          </>
                        ) : isRequesting ? (
                          <>
                            <RefreshCw size={16} />
                            Sending...
                          </>
                        ) : (
                          <>
                            Request Exchange
                            <ArrowUpRight size={16} />
                          </>
                        )}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SkillsPage;

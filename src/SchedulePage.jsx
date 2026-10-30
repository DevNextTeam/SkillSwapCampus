
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  RefreshCw,
  Pencil,
  Save,
  X,
  CheckCircle2,
  Check,
  XCircle,
  Hourglass,
} from "lucide-react";

import { apiRequest } from "./api";

const CAMPUS_LOCATIONS = [
  "Campus Library",
  "Computer Laboratory",
  "Classroom",
  "Canteen",
  "Student Lounge",
];

function getLocalDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function SchedulePage({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [respondingId, setRespondingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [form, setForm] = useState({
    scheduled_at: "",
    location_choice: "",
    custom_location: "",
  });

  async function loadSchedule(showLoading = true) {
    if (showLoading) setLoading(true);

    try {
      const result = await apiRequest("get_exchanges.php");

      const acceptedSessions = (result.exchanges || []).filter(
        (exchange) => exchange.status === "accepted"
      );

      setSessions(acceptedSessions);
    } catch (error) {
      setMessage(error.message || "Unable to load your schedule.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule();
  }, []);

  function startEditing(session) {
    const scheduledAt = session.scheduled_at
      ? session.scheduled_at.replace(" ", "T").slice(0, 16)
      : "";

    const existingLocation = session.meeting_location || "";

    const isCampusLocation = CAMPUS_LOCATIONS.includes(
      existingLocation
    );

    setForm({
      scheduled_at: scheduledAt,
      location_choice: isCampusLocation
        ? existingLocation
        : existingLocation
          ? "Other"
          : "",
      custom_location: isCampusLocation ? "" : existingLocation,
    });

    setEditingId(session.id);
    setMessage("");
    setMessageType("");
  }

  function cancelEditing() {
    setEditingId(null);

    setForm({
      scheduled_at: "",
      location_choice: "",
      custom_location: "",
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSave(sessionId) {
    if (savingId !== null) return;

    if (!form.scheduled_at) {
      setMessage("Please choose a date and time.");
      setMessageType("error");
      return;
    }

    if (new Date(form.scheduled_at).getTime() <= Date.now()) {
      setMessage("Please choose a future date and time.");
      setMessageType("error");
      return;
    }

    if (!form.location_choice) {
      setMessage("Please select a meeting location.");
      setMessageType("error");
      return;
    }

    let meetingLocation = form.location_choice;

    if (form.location_choice === "Other") {
      meetingLocation = form.custom_location.trim();

      if (!meetingLocation) {
        setMessage("Please enter your custom meeting location.");
        setMessageType("error");
        return;
      }
    }

    if (meetingLocation.length > 255) {
      setMessage("Meeting location must not exceed 255 characters.");
      setMessageType("error");
      return;
    }

    const submittedDate = form.scheduled_at.replace("T", " ");

    setSavingId(sessionId);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest(
        "update_session_details.php",
        {
          method: "POST",
          body: JSON.stringify({
            exchange_id: sessionId,
            scheduled_at: form.scheduled_at,
            meeting_location: meetingLocation,
          }),
        }
      );

      // Update the schedule immediately after the server confirms success.
      setSessions((previousSessions) =>
        previousSessions.map((session) => {
          if (Number(session.id) !== Number(sessionId)) {
            return session;
          }

          return {
            ...session,
            scheduled_at: result.scheduled_at || submittedDate,
            meeting_location:
              result.meeting_location || meetingLocation,
            schedule_status: "pending",
            schedule_proposed_by: user.id,
            schedule_action: "waiting",
          };
        })
      );

      setEditingId(null);

      setForm({
        scheduled_at: "",
        location_choice: "",
        custom_location: "",
      });

      setMessage(
        result.message ||
          "Schedule proposal sent! Waiting for confirmation."
      );

      setMessageType("success");

    } catch (error) {
      setMessage(
        error.message || "Unable to submit the schedule proposal."
      );

      setMessageType("error");
    } finally {
      setSavingId(null);
    }
  }

  async function handleScheduleResponse(sessionId, action) {
    if (respondingId !== null) return;

    setRespondingId(sessionId);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest(
        "respond_to_schedule.php",
        {
          method: "POST",
          body: JSON.stringify({
            exchange_id: sessionId,
            action,
          }),
        }
      );

      await loadSchedule(false);

      setMessage(
        result.message || "Your response has been saved."
      );

      setMessageType("success");

    } catch (error) {
      setMessage(
        error.message || "Unable to process your response."
      );

      setMessageType("error");

      await loadSchedule(false);
    } finally {
      setRespondingId(null);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return "Not scheduled yet";

    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
      return "Not scheduled yet";
    }

    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(dateValue) {
    if (!dateValue) return "Not scheduled";

    const date = new Date(dateValue.replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
      return "Not scheduled";
    }

    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  const upcomingSessions = sessions.filter((session) => {
    if (
      session.schedule_status !== "confirmed" ||
      !session.scheduled_at
    ) {
      return false;
    }

    const date = new Date(
      session.scheduled_at.replace(" ", "T")
    );

    return !Number.isNaN(date.getTime()) && date >= new Date();
  });

  const unscheduledSessions = sessions.filter(
    (session) =>
      session.schedule_status === "unscheduled" ||
      session.schedule_status === "declined"
  );

  return (
    <div className="schedule-page">
      <div className="skills-page-heading">
        <div>
          <span className="skills-page-eyebrow">
            <CalendarDays size={15} />
            LEARNING SESSION PLANNER
          </span>

          <h2>My Schedule</h2>

          <p>
            Organize your learning sessions and meet fellow students.
          </p>
        </div>

        <button
          className="skills-refresh-button"
          onClick={() => loadSchedule()}
          disabled={loading}
          title="Refresh schedule"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {message && (
        <div className={`profile-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="schedule-summary">
        <div className="schedule-summary-card">
          <CalendarDays size={21} />
          <div>
            <strong>{sessions.length}</strong>
            <span>Accepted sessions</span>
          </div>
        </div>

        <div className="schedule-summary-card">
          <Clock size={21} />
          <div>
            <strong>{upcomingSessions.length}</strong>
            <span>Upcoming sessions</span>
          </div>
        </div>

        <div className="schedule-summary-card">
          <Hourglass size={21} />
          <div>
            <strong>{unscheduledSessions.length}</strong>
            <span>Not scheduled</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="skills-empty">
          <RefreshCw size={25} />
          <p>Loading your schedule...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="skills-empty">
          <CalendarDays size={35} />
          <h3>No scheduled sessions yet</h3>
          <p>
            When an exchange request is accepted, it will appear here.
            You can then arrange your learning session.
          </p>
        </div>
      ) : (
        <>
          <div className="schedule-section-heading">
            <h3>Accepted learning sessions</h3>
            <span>{sessions.length} sessions</span>
          </div>

          <div className="schedule-grid">
            {sessions.map((session) => {
              const isRequester =
                Number(session.requester_id) === Number(user.id);

              const otherStudent = isRequester
                ? session.receiver_name
                : session.requester_name;

              const otherUniversity = isRequester
                ? session.receiver_university
                : session.requester_university;

              const isEditing = editingId === session.id;
              const isSaving = savingId === session.id;
              const isResponding = respondingId === session.id;

              const scheduleStatus =
                session.schedule_status || "unscheduled";

              const scheduleAction =
                session.schedule_action || "none";

              return (
                <article
                  className="schedule-card"
                  key={session.id}
                >
                  <div className="schedule-card-top">
                    <span className="schedule-status">
                      <CheckCircle2 size={14} />
                      Exchange Accepted
                    </span>

                    <span className="schedule-category">
                      {session.category || "General"}
                    </span>
                  </div>

                  <h3>{session.skill_name}</h3>

                  <div className="schedule-student">
                    <div className="database-skill-avatar">
                      {(otherStudent || "S")
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean)
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <div>
                      <strong>{otherStudent}</strong>
                      <span>
                        {otherUniversity || "Campus Member"}
                      </span>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="schedule-edit-form">
                      <div className="schedule-proposal-notice">
                        <CalendarDays size={17} />
                        <span>
                          You are proposing a meeting schedule or
                          suggesting a change. The other student
                          must confirm the latest proposal.
                        </span>
                      </div>

                      <label htmlFor={`date-${session.id}`}>
                        Proposed date and time
                      </label>

                      <input
                        id={`date-${session.id}`}
                        type="datetime-local"
                        name="scheduled_at"
                        value={form.scheduled_at}
                        onChange={handleChange}
                        min={getLocalDateTimeValue()}
                        required
                      />

                      <label htmlFor={`location-${session.id}`}>
                        Choose a campus meeting location
                      </label>

                      <select
                        id={`location-${session.id}`}
                        name="location_choice"
                        value={form.location_choice}
                        onChange={handleChange}
                        required
                      >
                        <option value="">
                          Select a meeting location
                        </option>

                        {CAMPUS_LOCATIONS.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}

                        <option value="Other">
                          Other — Custom Location
                        </option>
                      </select>

                      {form.location_choice === "Other" && (
                        <>
                          <label htmlFor={`custom-${session.id}`}>
                            Enter your custom meeting location
                          </label>

                          <input
                            id={`custom-${session.id}`}
                            type="text"
                            name="custom_location"
                            value={form.custom_location}
                            onChange={handleChange}
                            placeholder="Enter meeting place"
                            maxLength={255}
                            required
                          />
                        </>
                      )}

                      <div className="schedule-edit-actions">
                        <button
                          type="button"
                          className="skill-cancel-button"
                          onClick={cancelEditing}
                          disabled={isSaving}
                        >
                          <X size={16} />
                          Cancel
                        </button>

                        <button
                          type="button"
                          className="primary-button"
                          onClick={() => handleSave(session.id)}
                          disabled={isSaving}
                        >
                          <Save size={16} />
                          {isSaving ? "Sending..." : "Send Proposal"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {scheduleStatus === "pending" && (
                        <div className="schedule-proposal-notice">
                          <Hourglass size={18} />
                          <div>
                            <strong>
                              {scheduleAction === "waiting"
                                ? "Waiting for confirmation"
                                : "Schedule proposal received"}
                            </strong>

                            <span>
                              {scheduleAction === "waiting"
                                ? "Your proposed schedule is waiting for the other student's response."
                                : "Review the proposed date and meeting location below."}
                            </span>
                          </div>
                        </div>
                      )}

                      {scheduleStatus === "confirmed" && (
                        <div className="schedule-confirmed-notice">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Schedule confirmed!</strong>
                            <span>
                              Both students have agreed to this meeting.
                            </span>
                          </div>
                        </div>
                      )}

                      {scheduleStatus === "declined" && (
                        <div className="schedule-declined-notice">
                          <XCircle size={18} />
                          <div>
                            <strong>Proposal declined</strong>
                            <span>
                              Either student can now submit a new proposal.
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="schedule-detail">
                        <CalendarDays size={18} />
                        <div>
                          <span>
                            {scheduleStatus === "pending"
                              ? "Proposed date"
                              : "Date"}
                          </span>
                          <strong>
                            {formatDate(session.scheduled_at)}
                          </strong>
                        </div>
                      </div>

                      <div className="schedule-detail">
                        <Clock size={18} />
                        <div>
                          <span>Time</span>
                          <strong>
                            {formatTime(session.scheduled_at)}
                          </strong>
                        </div>
                      </div>

                      <div className="schedule-detail">
                        <MapPin size={18} />
                        <div>
                          <span>
                            {scheduleStatus === "pending"
                              ? "Proposed meeting location"
                              : "Meeting location"}
                          </span>
                          <strong>
                            {session.meeting_location ||
                              "Not decided yet"}
                          </strong>
                        </div>
                      </div>

                      {(scheduleStatus === "unscheduled" ||
                        scheduleStatus === "declined") && (
                        <button
                          type="button"
                          className="schedule-edit-button"
                          onClick={() => startEditing(session)}
                        >
                          <Pencil size={16} />
                          {scheduleStatus === "declined"
                            ? "Propose a New Schedule"
                            : "Propose a Schedule"}
                        </button>
                      )}

                      {scheduleStatus === "pending" && (
                        <>
                          <button
                            type="button"
                            className="schedule-edit-button"
                            onClick={() => startEditing(session)}
                          >
                            <Pencil size={16} />
                            {scheduleAction === "waiting"
                              ? "Edit Your Proposal"
                              : "Suggest a Different Schedule"}
                          </button>

                          {scheduleAction === "waiting" && (
                            <div className="schedule-waiting-label">
                              <Hourglass size={16} />
                              Waiting for the other student
                            </div>
                          )}

                          {scheduleAction === "respond" && (
                            <div className="schedule-edit-actions">
                              <button
                                type="button"
                                className="skill-cancel-button"
                                onClick={() =>
                                  handleScheduleResponse(
                                    session.id,
                                    "decline"
                                  )
                                }
                                disabled={isResponding}
                              >
                                <X size={16} />
                                {isResponding
                                  ? "Processing..."
                                  : "Decline"}
                              </button>

                              <button
                                type="button"
                                className="primary-button"
                                onClick={() =>
                                  handleScheduleResponse(
                                    session.id,
                                    "confirm"
                                  )
                                }
                                disabled={isResponding}
                              >
                                <Check size={16} />
                                {isResponding
                                  ? "Processing..."
                                  : "Confirm"}
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {scheduleStatus === "confirmed" && (
                        <>
                          <div className="schedule-confirmed-label">
                            <CheckCircle2 size={16} />
                            Agreed by both students
                          </div>

                          <button
                            type="button"
                            className="schedule-edit-button"
                            onClick={() => startEditing(session)}
                          >
                            <Pencil size={16} />
                            Request a Schedule Change
                          </button>
                        </>
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default SchedulePage;


import { useEffect, useRef, useState } from "react";
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Inbox,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { apiRequest } from "./api";
import "./ExchangesPage.css";

function ExchangesPage({ onNavigate, initialStatus = "all" }) {
  const [exchanges, setExchanges] = useState([]);
  const latestLoadId = useRef(0);
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Load exchange requests from the database.
  // showLoading=false refreshes the data without hiding the page.
  async function loadExchanges(showLoading = true) {
    const loadId = ++latestLoadId.current;

    if (showLoading) {
      setLoading(true);
    }

    try {
      const result = await apiRequest("get_exchanges.php");

      // Ignore older responses that finish after a newer refresh/update.
      if (loadId !== latestLoadId.current) return false;
      setExchanges(result.exchanges || []);

      return true;
    } catch (error) {
      if (loadId !== latestLoadId.current) return false;
      setMessage(
        error.message || "Unable to load your exchanges."
      );

      setMessageType("error");

      return false;
    } finally {
      if (showLoading && loadId === latestLoadId.current) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) loadExchanges(); });
    return () => { active = false; };
  }, []);

  // Accept or reject a received exchange request.
  async function handleResponse(exchangeId, status) {
    // Prevent multiple clicks while a request is processing.
    if (updatingId !== null) {
      return;
    }

    setUpdatingId(exchangeId);
    setMessage("");
    setMessageType("");

    try {
      const result = await apiRequest(
        "update_exchange_status.php",
        {
          method: "POST",
          body: JSON.stringify({
            exchange_id: exchangeId,
            status: status,
          }),
        }
      );

      // Refuse to update the UI if the server confirms a different request ID.
      if (String(result.exchange_id) !== String(exchangeId)) {
        throw new Error("The server response did not match the selected exchange. Please refresh.");
      }

      // Update only the selected card immediately; never bulk-change local statuses.
      setExchanges((current) =>
        current.map((item) =>
          String(item.id) === String(exchangeId)
            ? { ...item, status: result.status }
            : item
        )
      );

      setMessage(
        result.message || "This exchange request was updated."
      );
      setMessageType("success");

      // Reconcile with the database after the selected card has updated.
      await loadExchanges(false);

    } catch (error) {
      const errorMessage = error.message || "";

      // Another device may have already answered this request.
      if (
        errorMessage.includes("already been answered") ||
        errorMessage.includes("already been updated")
      ) {
        await loadExchanges(false);

        setMessage(
          "This request was already answered on another device. Your exchange list has been refreshed."
        );

        setMessageType("error");

      } else {
        setMessage(
          errorMessage || "Unable to update this request."
        );

        setMessageType("error");
      }

    } finally {
      // Always release the button after the operation finishes.
      setUpdatingId(null);
    }
  }

  // Search by skill, student, or university, then narrow by direction and status.
  const filteredExchanges = exchanges.filter((exchange) => {
    const directionMatches = activeTab === "all" || exchange.request_direction === activeTab;
    const statusMatches = statusFilter === "all" || exchange.status === statusFilter;
    const searchable = [
      exchange.skill_name,
      exchange.category,
      exchange.requester_name,
      exchange.receiver_name,
      exchange.requester_university,
      exchange.receiver_university,
    ].filter(Boolean).join(" ").toLowerCase();
    return directionMatches && statusMatches && searchable.includes(search.trim().toLowerCase());
  });

  // Format the proposed session date.
  function formatDate(dateValue) {
    if (!dateValue) {
      return "Not scheduled yet";
    }

    const date = new Date(
      dateValue.replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // Display readable status labels.
  function getStatusLabel(status) {
    const labels = {
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      completed: "Completed",
    };

    return labels[status] || status;
  }

  const pendingCount = exchanges.filter(
    (item) => item.status === "pending"
  ).length;

  const acceptedCount = exchanges.filter(
    (item) => item.status === "accepted"
  ).length;

  const completedCount = exchanges.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <div className="exchanges-page">

      {/* PAGE HEADING */}
      <div className="exchanges-heading">
        <div>
          <span className="exchanges-eyebrow">
            <GraduationCap size={15} />
            CAMPUS CONNECTIONS
          </span>

          <h2>My Exchanges</h2>

          <p>
            Keep track of the skills you're sharing and learning
            with other students.
          </p>
        </div>

        <button
          type="button"
          className="exchanges-refresh-button"
          onClick={() => loadExchanges()}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="exchanges-summary">

        <div className="exchange-summary-card">
          <span>Total requests</span>
          <strong>{exchanges.length}</strong>
        </div>

        <div className="exchange-summary-card">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </div>

        <div className="exchange-summary-card">
          <span>Accepted</span>
          <strong>{acceptedCount}</strong>
        </div>

        <div className="exchange-summary-card">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </div>

      </div>

      {/* SUCCESS AND ERROR MESSAGES */}
      {message && (
        <div
          className={`exchanges-message ${messageType}`}
          role="status"
        >
          {message}
        </div>
      )}

      {/* REQUEST TABS */}
      <div className="exchanges-tabs">

        <button
          type="button"
          className={activeTab === "all" ? "active" : ""}
          onClick={() => setActiveTab("all")}
        >
          All requests
        </button>

        <button
          type="button"
          className={activeTab === "received" ? "active" : ""}
          onClick={() => setActiveTab("received")}
        >
          <ArrowDownLeft size={16} />
          Received
        </button>

        <button
          type="button"
          className={activeTab === "sent" ? "active" : ""}
          onClick={() => setActiveTab("sent")}
        >
          <ArrowUpRight size={16} />
          Sent
        </button>

      </div>

      <div className="exchange-tools">
        <label className="exchange-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search skills, students, or campus..." aria-label="Search exchanges" />
          {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16} /></button>}
        </label>
        <label className="exchange-status-filter">
          <SlidersHorizontal size={16} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter exchanges by status">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <span className="exchange-result-count">{filteredExchanges.length} of {exchanges.length} requests</span>
      </div>

      {/* EXCHANGE REQUESTS */}
      {loading ? (

        <div className="exchanges-empty">
          <RefreshCw
            size={26}
            className="exchanges-loading-icon"
          />

          <p>Loading your exchange requests...</p>
        </div>

      ) : filteredExchanges.length === 0 ? (

        <div className="exchanges-empty">
          <Inbox size={38} />

          <h3>{search || statusFilter !== "all" ? "No matching exchanges" : "No exchange requests yet"}</h3>

          <p>
            {search || statusFilter !== "all" ? "Try a different search or clear the selected filters." : activeTab === "sent" ? "The requests you send to other students will appear here." : activeTab === "received" ? "Requests from other students will appear here." : "When you connect with students through skill posts, your exchanges will appear here."}
          </p>
        </div>

      ) : (

        <div className="exchanges-list">

          {filteredExchanges.map((exchange) => {

            const isReceived =
              exchange.request_direction === "received";

            const otherStudent = isReceived
              ? exchange.requester_name
              : exchange.receiver_name;

            const otherUniversity = isReceived
              ? exchange.requester_university
              : exchange.receiver_university;

            const isPending =
              exchange.status === "pending";

            const isUpdating =
              String(updatingId) === String(exchange.id);

            return (
              <article
                className="exchange-card"
                key={exchange.id}
              >

                {/* CARD HEADER */}
                <div className="exchange-card-top">

                  <span
                    className={`exchange-direction ${
                      isReceived ? "received" : "sent"
                    }`}
                  >
                    {isReceived ? (
                      <ArrowDownLeft size={15} />
                    ) : (
                      <ArrowUpRight size={15} />
                    )}

                    {isReceived
                      ? "Received request"
                      : "Sent request"}
                  </span>

                  <span
                    className={`exchange-status status-${exchange.status}`}
                  >
                    {exchange.status === "pending" ? (
                      <Clock3 size={14} />
                    ) : exchange.status === "accepted" ||
                      exchange.status === "completed" ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}

                    {getStatusLabel(exchange.status)}
                  </span>

                </div>

                {/* SKILL INFORMATION */}
                <div className="exchange-card-content">

                  <div className="exchange-skill-icon">
                    <BookOpen size={23} />
                  </div>

                  <div className="exchange-skill-info">
                    <h3>{exchange.skill_name}</h3>

                    <span>
                      {exchange.category || "General"}
                    </span>
                  </div>

                </div>

                {/* STUDENT INFORMATION */}
                <div className="exchange-student-info">

                  <div className="exchange-avatar">
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
                    <small>
                      {isReceived
                        ? "Requested by"
                        : "Request sent to"}
                    </small>

                    <strong>
                      {otherStudent || "Campus Student"}
                    </strong>

                    <span>
                      {otherUniversity || "Campus Member"}
                    </span>
                  </div>

                </div>

                {/* PROPOSED DATE */}
                <div className="exchange-scheduled">

                  <Clock3 size={16} />

                  <span>
                    Proposed date:{" "}
                    {formatDate(exchange.scheduled_at)}
                  </span>

                </div>

                {/* ACCEPT AND REJECT BUTTONS */}
                {isReceived && isPending && (

                  <div className="exchange-actions">

                    <button
                      type="button"
                      className="exchange-reject-button"
                      onClick={() =>
                        handleResponse(exchange.id, "rejected")
                      }
                      disabled={updatingId !== null}
                    >
                      <XCircle size={16} />

                      {isUpdating
                        ? "Updating..."
                        : "Reject"}
                    </button>

                    <button
                      type="button"
                      className="exchange-accept-button"
                      onClick={() =>
                        handleResponse(exchange.id, "accepted")
                      }
                      disabled={updatingId !== null}
                    >
                      <CheckCircle2 size={16} />

                      {isUpdating
                        ? "Updating..."
                        : "Accept request"}
                    </button>

                  </div>

                )}

                {exchange.status === "accepted" && (
                  <div className="exchange-actions exchange-accepted-actions">
                    <button
                      type="button"
                      className="exchange-schedule-button"
                      onClick={() => onNavigate?.("My Schedule")}
                    >
                      <CalendarDays size={16} />
                      Plan learning session
                    </button>
                    <button
                      type="button"
                      className="exchange-accept-button"
                      onClick={() => {
                        if (window.confirm("Mark this skill exchange as completed?")) {
                          handleResponse(exchange.id, "completed");
                        }
                      }}
                      disabled={updatingId !== null}
                    >
                      <CheckCircle2 size={16} />
                      {isUpdating ? "Updating..." : "Mark as completed"}
                    </button>
                  </div>
                )}

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default ExchangesPage;

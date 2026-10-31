
import { useEffect, useState } from "react";
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock3,
  BookOpen,
  GraduationCap,
  Inbox,
} from "lucide-react";

import { apiRequest } from "./api";
import "./ExchangesPage.css";

function ExchangesPage() {
  const [exchanges, setExchanges] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Load exchange requests from the database.
  // showLoading=false refreshes the data without hiding the page.
  async function loadExchanges(showLoading = true) {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const result = await apiRequest("get_exchanges.php");

      setExchanges(result.exchanges || []);

      return true;
    } catch (error) {
      setMessage(
        error.message || "Unable to load your exchanges."
      );

      setMessageType("error");

      return false;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {\n    let active = true;\n    Promise.resolve().then(() => { if (active) loadExchanges(); });\n    return () => { active = false; };\n  }, []);

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

      // Refresh the list without showing the initial loading screen.
      await loadExchanges(false);

      setMessage(
        result.message || "Request updated successfully!"
      );

      setMessageType("success");

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

  // Filter requests by direction.
  const filteredExchanges = exchanges.filter((exchange) => {
    if (activeTab === "sent") {
      return exchange.request_direction === "sent";
    }

    if (activeTab === "received") {
      return exchange.request_direction === "received";
    }

    return true;
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

          <h3>No exchange requests yet</h3>

          <p>
            {activeTab === "sent"
              ? "The requests you send to other students will appear here."
              : activeTab === "received"
                ? "Requests from other students will appear here."
                : "When you connect with students through skill posts, your exchanges will appear here."}
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

              </article>
            );
          })}

        </div>
      )}

    </div>
  );
}

export default ExchangesPage;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useSafeBack from "../../hooks/useSafeBack";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaVolumeHigh,
  FaPills,
  FaCalendarCheck,
  FaRobot,
  FaTriangleExclamation,
  FaCircleInfo,
} from "react-icons/fa6";

import {
  markNotificationRead,
  markAllNotificationsRead,
  getAISummaries,
} from "../../services/api/elderApi";
import {
  getVoiceNotificationSettings, notificationAnnouncementText, speakText,
} from "../../services/voice/speechSynthesis";

export default function ElderNotificationsPage({
  notifications = [],
  appointments = [],
  profile,
  onRefreshNotifications,
}) {
  const goBack = useSafeBack("/elder/dashboard");
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [readingSummaryId, setReadingSummaryId] = useState(null);
  const [summarySpeechStatus, setSummarySpeechStatus] = useState("");

  const isTelugu = profile?.preferred_language === "Telugu";

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleReadAloud = (item) => {
    const settings = getVoiceNotificationSettings();
    const appointment = item.related_object_type === "appointment"
      ? appointments.find((record) => String(record.id) === String(item.related_object_id))
      : null;
    const text = notificationAnnouncementText(item, isTelugu ? "Telugu" : "English", settings.readDetails, appointment);
    speakText(text, isTelugu ? "te-IN" : "en-IN", profile?.voice_speed || 1, undefined, { voiceName: settings.voiceName, rememberAsLast: true });
  };

  const handleReadPrivateUpdate = async (summaryId) => {
    if (readingSummaryId) return;
    setReadingSummaryId(summaryId);
    setSummarySpeechStatus("");
    try {
      const summaries = await getAISummaries();
      const summary = summaries.find((item) => String(item.id) === String(summaryId) && item.status === "SHARED");
      if (!summary?.summary) {
        setSummarySpeechStatus("This private update is no longer available to read.");
        return;
      }
      const started = speakText(summary.summary, isTelugu ? "te-IN" : "en-IN", profile?.voice_speed || 1, (state) => {
        if (state === "speaking") setSummarySpeechStatus("Reading the private update aloud.");
        else if (state === "error" || state === "unsupported") setSummarySpeechStatus("Speech is unavailable. The update is still available on screen.");
        else if (state === "idle") setSummarySpeechStatus("Finished reading the update.");
        else if (state === "stopped") setSummarySpeechStatus("Speech stopped.");
      }, { rememberAsLast: true });
      if (!started) setSummarySpeechStatus("Speech is unavailable. The update is still available on screen.");
    } catch (error) {
      setSummarySpeechStatus(error?.message || "Could not load the private update.");
    } finally {
      setReadingSummaryId(null);
    }
  };

  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case "MEDICINE":
        return <FaPills />;
      case "APPOINTMENT":
        return <FaCalendarCheck />;
      case "SOS":
        return <FaTriangleExclamation />;
      case "AI_SUMMARY":
        return <FaRobot />;
      default:
        return <FaCircleInfo />;
    }
  };

  return (
    <div className="elder-subpage">
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={goBack}
        >
          <FaArrowLeft /> Back to Home
        </button>
        <div>
          <h1>Important Notifications</h1>
          <p>Care reminders, appointments, and messages from your family</p>
        </div>
      </div>

      <div className="elder-card elder-notif-toolbar">
        <div className="notif-filters">
          <button
            type="button"
            className={`notif-filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All Updates ({notifications.length})
          </button>
          <button
            type="button"
            className={`notif-filter-tab ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            className="btn-mark-all-page"
            onClick={handleMarkAllRead}
          >
            <FaCheck /> Mark All as Read
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="elder-card elder-empty-full">
          <FaBell className="empty-icon-lg" />
          <h2>All Caught Up!</h2>
          <p>
            {filter === "unread"
              ? "You have no unread notifications."
              : "You have no notifications right now."}
          </p>
        </div>
      ) : (
        <div className="elder-notifications-stack">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`elder-card notif-full-card ${
                !item.is_read ? "unread" : ""
              }`}
            >
              <div
                className={`notif-card-icon ${
                  item.notification_type === "SOS"
                    ? "sos"
                    : item.notification_type === "MEDICINE"
                      ? "medicine"
                      : item.notification_type === "APPOINTMENT"
                        ? "appointment"
                        : "general"
                }`}
              >
                {getIcon(item.notification_type)}
              </div>

              <div className="notif-card-content">
                <div className="notif-card-title-row">
                  <h3>{item.title}</h3>
                  {!item.is_read && <span className="unread-badge">New</span>}
                </div>
                <p className="notif-card-message">{item.message}</p>
                <span className="notif-card-time">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </span>
              </div>

              <div className="notif-card-actions">
                <button
                  type="button"
                  className="btn-listen-notif"
                  onClick={() => handleReadAloud(item)}
                  title="Read aloud"
                >
                  <FaVolumeHigh /> Listen
                </button>

                {item.notification_type === "MEDICINE" && (
                  <button type="button" className="btn-read-toggle" onClick={() => navigate("/elder/medicines")}>Open medicine schedule</button>
                )}
                {item.notification_type === "APPOINTMENT" && (
                  <button type="button" className="btn-read-toggle" onClick={() => navigate("/elder/appointments")}>Open appointments</button>
                )}
                {item.notification_type === "AI_SUMMARY" && Number.isInteger(item.data?.summary_id) && (
                  <button type="button" className="btn-read-toggle" disabled={readingSummaryId === item.data.summary_id} onClick={() => handleReadPrivateUpdate(item.data.summary_id)}>
                    {readingSummaryId === item.data.summary_id ? "Loading update…" : "Read private update aloud"}
                  </button>
                )}

                {!item.is_read && (
                  <button
                    type="button"
                    className="btn-read-toggle"
                    onClick={() => handleMarkRead(item.id)}
                  >
                    <FaCheck /> Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {summarySpeechStatus && <p className="elder-card" role="status" aria-live="polite">{summarySpeechStatus}</p>}
    </div>
  );
}

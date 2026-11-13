import React, { useEffect, useState } from "react";

import {
  FaBell,
  FaPills,
  FaCalendarCheck,
  FaRobot,
  FaTriangleExclamation,
  FaCheck,
  FaFilter,
} from "react-icons/fa6";

import { getNotifications, getSOSEvents, markNotificationRead, updateSOSEvent } from "../../services/api/familyApi";
import "../../styles/family/NotificationsPage.css";

export default function NotificationsPage({ selectedElder }) {
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sosEvents, setSosEvents] = useState([]);

  const loadNotifications = async () => {
    try {
      setError("");
      const rows = await getNotifications();
      const events = await getSOSEvents();
      const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
      const visible = elderId ? rows.filter((item) => !item.elder || String(item.elder.id) === String(elderId)) : [];
      setSosEvents(elderId ? events.filter((item) => String(item.elder_id) === String(elderId)) : events);
      setNotifications(visible.map((item) => {
        const type = item.notification_type === "MEDICINE" ? "medicine" : item.notification_type === "APPOINTMENT" ? "appointment" : item.notification_type === "AI_SUMMARY" ? "ai" : item.notification_type === "SOS" ? "emergency" : "system";
        const category = type === "medicine" ? "Medicine" : type === "appointment" ? "Appointments" : type === "ai" ? "AI Companion" : type === "emergency" ? "Alerts" : "System";
        const icon = type === "medicine" ? <FaPills /> : type === "appointment" ? <FaCalendarCheck /> : type === "ai" ? <FaRobot /> : type === "emergency" ? <FaTriangleExclamation /> : <FaBell />;
        return { ...item, type, category, icon, unread: !item.is_read, time: item.created_at ? new Date(item.created_at).toLocaleString() : "" };
      }));
    } catch (err) { setError(err.message || "Unable to load notifications."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotifications(); }, [selectedElder]);

  const unreadCount = notifications.filter((item) => item.unread).length;
  const filteredNotifications = filter === "All" ? notifications : filter === "Unread" ? notifications.filter((item) => item.unread) : notifications.filter((item) => item.category === filter);

  const markAsRead = async (id) => {
    try { await markNotificationRead(id); setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, unread: false, is_read: true } : item)); }
    catch (err) { setError(err.message || "Unable to update notification."); }
  };

  const markAllAsRead = async () => {
    try { await Promise.all(notifications.filter((item) => item.unread).map((item) => markNotificationRead(item.id))); setNotifications((prev) => prev.map((item) => ({ ...item, unread: false, is_read: true }))); }
    catch (err) { setError(err.message || "Unable to update notifications."); }
  };

  const updateSos = async (id, action) => {
    try {
      const updated = await updateSOSEvent(id, action);
      setSosEvents((previous) => previous.map((event) => event.id === id ? updated : event));
    } catch (err) { setError(err.message || "Unable to update emergency alert."); }
  };

  return (
    <div className="notifications-page">

      {/* Page Heading */}
      <section className="notifications-hero">

        <div className="notifications-hero-left">

          <div className="notifications-hero-icon">
            <FaBell />
          </div>

          <div>
            <h1>Notifications</h1>

            <p>
              Stay updated with important information
              about your parent's care.
            </p>
          </div>

        </div>

        <div className="notifications-hero-right">
          <span>
            “Stay informed,
          </span>

          <span>
            stay connected.”
          </span>
        </div>

      </section>


      {/* Summary Cards */}
      <section className="notification-summary">

        <div className="notification-summary-card unread-card">
          <span>Unread</span>
          <strong>{unreadCount}</strong>
          <small>Needs your attention</small>
        </div>

        <div className="notification-summary-card today-card">
          <span>Total Notifications</span>
          <strong>{notifications.length}</strong>
          <small>Recent updates</small>
        </div>

        <div className="notification-summary-card alert-card">
          <span>Important Alerts</span>
          <strong>
            {
              notifications.filter(
                (notification) =>
                  notification.category === "Alerts"
              ).length
            }
          </strong>
          <small>Health related</small>
        </div>

      </section>


      {/* Notification Controls */}
      <section className="notification-controls">

        <div className="notification-filters">

          <FaFilter />

          {[
            "All",
            "Unread",
            "Medicine",
            "Appointments",
            "AI Companion",
            "Alerts",
            "System",
          ].map((item) => (

            <button
              key={item}
              type="button"
              className={
                filter === item
                  ? "active"
                  : ""
              }
              onClick={() => setFilter(item)}
            >
              {item}
            </button>

          ))}

        </div>


        {unreadCount > 0 && (
          <button
            type="button"
            className="mark-all-page-button"
            onClick={markAllAsRead}
          >
            <FaCheck />
            Mark all as read
          </button>
        )}

      </section>


      {/* Notifications List */}
      <section className="notifications-list-card">
        <div className="notifications-list-header"><div><h2>Emergency SOS alerts</h2><p>Alerts for elders you are authorized to support</p></div></div>
        {loading ? <div className="notifications-empty">Loading emergency alerts…</div> : sosEvents.length === 0 ? <div className="notifications-empty">No emergency events found.</div> : (
          <div className="full-notification-list">
            {sosEvents.map((event) => (
              <article className="full-notification-item" key={event.id}>
                <div className="full-notification-icon emergency"><FaTriangleExclamation /></div>
                <div className="full-notification-content">
                  <h3>{event.elder_name} — Emergency SOS</h3>
                  <p>{new Date(event.created_at).toLocaleString()} · {event.location_available ? `Location ${event.latitude}, ${event.longitude}${event.accuracy != null ? ` (±${event.accuracy} m)` : ""}` : "Location unavailable"}</p>
                  <p>In-app alert status: {event.notification_status === "SENT" ? `saved for ${event.notification_recipient_count} family member(s)` : event.notification_status.toLowerCase()}</p>
                  {event.maps_url && <a href={event.maps_url} target="_blank" rel="noreferrer">Open location in Google Maps</a>}
                  <div className="full-notification-meta"><span>{event.status}</span>{event.acknowledged_at && <small>Acknowledged {new Date(event.acknowledged_at).toLocaleString()}</small>}</div>
                  <div className="sos-modal-btn-row">
                    {!event.acknowledged_at && <button type="button" onClick={() => updateSos(event.id, "acknowledge")}>Acknowledge</button>}
                    {event.status !== "RESOLVED" && <button type="button" onClick={() => updateSos(event.id, "resolve")}>Mark resolved</button>}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="notifications-list-card">

        <div className="notifications-list-header">

          <div>
            <h2>Recent Notifications</h2>

            <p>
              {loading ? "Loading notifications…" : `${filteredNotifications.length} notifications`}
            </p>
          </div>

        </div>


        <div className="full-notification-list">

          {error ? <div className="notifications-empty" role="alert">{error}</div> : loading ? <div className="notifications-empty">Loading notifications…</div> : filteredNotifications.length === 0 ? (

            <div className="notifications-empty">

              <FaBell />

              <h3>No notifications found</h3>

              <p>
                You're all caught up.
              </p>

            </div>

          ) : (

            filteredNotifications.map((notification) => (

              <div
                key={notification.id}
                className={`full-notification-item ${
                  notification.unread
                    ? "unread"
                    : ""
                }`}
                onClick={() =>
                  markAsRead(notification.id)
                }
              >

                <div
                  className={`full-notification-icon ${notification.type}`}
                >
                  {notification.icon}
                </div>


                <div className="full-notification-content">

                  <div className="full-notification-title">

                    <h3>
                      {notification.title}
                    </h3>

                    {notification.unread && (
                      <span className="page-unread-dot">
                        Unread
                      </span>
                    )}

                  </div>

                  <p>
                    {notification.message}
                  </p>

                  <div className="full-notification-meta">

                    <span>
                      {notification.category}
                    </span>

                    <small>
                      {notification.time}
                    </small>

                  </div>

                </div>


                <button
                  type="button"
                  className="page-delete-notification"
                  title="Mark as read"
                  aria-label="Mark notification as read"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                >
                  <FaCheck />
                </button>

              </div>

            ))

          )}

        </div>

      </section>

    </div>
  );
}

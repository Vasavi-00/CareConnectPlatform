import React, { useState } from "react";

import {
  FaBell,
  FaPills,
  FaCalendarCheck,
  FaRobot,
  FaTriangleExclamation,
  FaCheck,
  FaTrash,
  FaFilter,
} from "react-icons/fa6";

import "../../styles/family/NotificationsPage.css";

export default function NotificationsPage() {

  const [filter, setFilter] = useState("All");

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "medicine",
      icon: <FaPills />,
      title: "Medicine Reminder",
      message:
        "Your parent's evening medicine is due at 8:00 PM.",
      time: "10 min ago",
      category: "Medicine",
      unread: true,
    },
    {
      id: 2,
      type: "appointment",
      icon: <FaCalendarCheck />,
      title: "Upcoming Appointment",
      message:
        "General checkup is scheduled for tomorrow at 10:30 AM.",
      time: "1 hour ago",
      category: "Appointments",
      unread: true,
    },
    {
      id: 3,
      type: "ai",
      icon: <FaRobot />,
      title: "AI Companion Update",
      message:
        "Your parent had a conversation with the AI Companion.",
      time: "3 hours ago",
      category: "AI Companion",
      unread: true,
    },
    {
      id: 4,
      type: "emergency",
      icon: <FaTriangleExclamation />,
      title: "Health Alert",
      message:
        "Please review your parent's latest health alert.",
      time: "Yesterday",
      category: "Alerts",
      unread: false,
    },
    {
      id: 5,
      type: "medicine",
      icon: <FaPills />,
      title: "Medicine Stock Update",
      message:
        "Your parent's Vitamin D medicine stock is running low.",
      time: "Yesterday",
      category: "Medicine",
      unread: false,
    },
    {
      id: 6,
      type: "appointment",
      icon: <FaCalendarCheck />,
      title: "Appointment Reminder",
      message:
        "Eye checkup with Dr. Ramesh is scheduled for 15 Sep.",
      time: "2 days ago",
      category: "Appointments",
      unread: false,
    },
  ]);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const filteredNotifications =
    filter === "All"
      ? notifications
      : filter === "Unread"
      ? notifications.filter(
          (notification) => notification.unread
        )
      : notifications.filter(
          (notification) =>
            notification.category === filter
        );

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter(
        (notification) => notification.id !== id
      )
    );
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

        <div className="notifications-list-header">

          <div>
            <h2>Recent Notifications</h2>

            <p>
              {filteredNotifications.length} notifications
            </p>
          </div>

        </div>


        <div className="full-notification-list">

          {filteredNotifications.length === 0 ? (

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
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <FaTrash />
                </button>

              </div>

            ))

          )}

        </div>

      </section>

    </div>
  );
}
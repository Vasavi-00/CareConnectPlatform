import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaCircleInfo,
  FaPills,
  FaCalendarCheck,
  FaRobot,
  FaTriangleExclamation,
  FaCheck,
  FaTrash,
  FaUser,
  FaGear,
  FaArrowRightFromBracket,
  FaPhone,
} from "react-icons/fa6";

import logo from "../../assets/images/logo.png";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/api/elderApi";

export default function ElderHeader({
  sidebarOpen,
  setSidebarOpen,
  user,
  profile,
  notifications,
  unreadCount,
  onRefreshNotifications,
}) {
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);

  useEffect(() => {
    if (notifications) {
      setLocalNotifications(notifications);
    }
  }, [notifications]);

  const firstName =
    profile?.first_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Elder";

  const fullName =
    `${profile?.first_name || user?.first_name || ""} ${profile?.last_name || user?.last_name || ""}`.trim() ||
    firstName;

  const avatarLetter = firstName.charAt(0).toUpperCase();

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      if (onRefreshNotifications) {
        onRefreshNotifications();
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("careconnect_access");
    localStorage.removeItem("careconnect_refresh");
    localStorage.removeItem("careconnect_user");
    navigate("/login");
  };

  const getNotificationIcon = (type) => {
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
    <header className="elder-header">
      {/* =================================================
          LEFT SIDE: Hamburger & Brand
      ================================================= */}
      <div className="elder-header-left">
        <button
          type="button"
          className="elder-menu-button"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          <FaBars />
        </button>

        <div
          className="elder-brand"
          onClick={() => navigate("/elder/dashboard")}
          role="button"
          tabIndex={0}
        >
          <img src={logo} alt="CareConnect" className="elder-header-logo" />
          <div className="elder-brand-text">
            <h2>CareConnect</h2>
            <span>Care. Connect. Always.</span>
          </div>
        </div>
      </div>

      {/* =================================================
          RIGHT SIDE: Notifications & Profile
      ================================================= */}
      <div className="elder-header-right">
        {/* Notifications Dropdown */}
        <div className="elder-notification-wrapper">
          <button
            type="button"
            className="elder-notification-btn"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="elder-notification-badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="elder-notification-dropdown">
              <div className="elder-dropdown-header">
                <div>
                  <h3>Notifications</h3>
                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}`
                      : "All caught up"}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="elder-mark-all-btn"
                    onClick={handleMarkAllAsRead}
                  >
                    <FaCheck /> Mark all as read
                  </button>
                )}
              </div>

              <div className="elder-dropdown-list">
                {localNotifications.length === 0 ? (
                  <div className="elder-dropdown-empty">
                    <FaBell />
                    <p>No notifications right now.</p>
                  </div>
                ) : (
                  localNotifications.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className={`elder-dropdown-item ${
                        !item.is_read ? "unread" : ""
                      }`}
                      onClick={() => handleMarkAsRead(item.id)}
                    >
                      <div
                        className={`elder-item-icon ${
                          item.notification_type === "SOS"
                            ? "sos"
                            : item.notification_type === "MEDICINE"
                              ? "medicine"
                              : item.notification_type === "APPOINTMENT"
                                ? "appointment"
                                : "general"
                        }`}
                      >
                        {getNotificationIcon(item.notification_type)}
                      </div>

                      <div className="elder-item-text">
                        <div className="elder-item-title-row">
                          <h4>{item.title}</h4>
                          {!item.is_read && <span className="unread-dot" />}
                        </div>
                        <p>{item.message}</p>
                        <span className="elder-item-time">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                }
                              )
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="elder-dropdown-footer-btn"
                onClick={() => {
                  setShowNotifications(false);
                  navigate("/elder/notifications");
                }}
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="elder-profile-wrapper">
          <button
            type="button"
            className="elder-profile-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="Profile menu"
          >
            <div className="elder-avatar-circle">{avatarLetter}</div>
            <div className="elder-profile-meta">
              <strong>Hi, {firstName}</strong>
              <span>Elder</span>
            </div>
            <FaChevronDown
              className={`elder-chevron ${showProfileMenu ? "open" : ""}`}
            />
          </button>

          {showProfileMenu && (
            <div className="elder-profile-dropdown">
              <div className="elder-profile-dropdown-header">
                <div className="elder-avatar-circle large">{avatarLetter}</div>
                <div>
                  <strong>{fullName}</strong>
                  <span className="role-pill">Elder Account</span>
                  {profile?.careconnect_id && (
                    <small className="cc-id-text">
                      ID: {profile.careconnect_id}
                    </small>
                  )}
                </div>
              </div>

              <div className="elder-profile-dropdown-links">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/elder/profile");
                  }}
                >
                  <FaUser /> My Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate("/elder/profile");
                  }}
                >
                  <FaGear /> Settings & Preferences
                </button>

                <button
                  type="button"
                  className="logout-link"
                  onClick={handleLogout}
                >
                  <FaArrowRightFromBracket /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
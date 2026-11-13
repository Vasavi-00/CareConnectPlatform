import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  FaUser,
  FaGear,
  FaArrowRightFromBracket,
  FaVolumeHigh,
  FaVolumeXmark,
  FaStop,
  FaSliders,
  FaXmark,
} from "react-icons/fa6";

import logo from "../../assets/images/logo.png";
import clearCareConnectSession from "../../services/clearSession";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/api/elderApi";
import {
  getVoiceNotificationSettings,
  speakText,
  stopSpeaking,
  saveVoiceNotificationSettings,
} from "../../services/voice/speechSynthesis";

export default function ElderHeader({
  sidebarOpen,
  setSidebarOpen,
  user,
  profile,
  notifications,
  unreadCount,
  onRefreshNotifications,
  isSpeechActive: isSpeechActiveProp,
  onStopSpeech,
  voiceEnabled: voiceEnabledProp,
  onToggleVoice,
}) {
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [localNotifications, setLocalNotifications] = useState([]);
  const [internalSpeechActive, setInternalSpeechActive] = useState(false);
  const [internalVoiceEnabled, setInternalVoiceEnabled] = useState(
    () => getVoiceNotificationSettings().enabled
  );
  const [voiceSettings, setVoiceSettings] = useState(() => getVoiceNotificationSettings());
  const [showVoiceMenu, setShowVoiceMenu] = useState(false);

  useEffect(() => {
    const handleSpeechStatus = (e) => {
      const state = e.detail?.state;
      if (state === "speaking" || state === "processing") {
        setInternalSpeechActive(true);
      } else if (
        state === "idle" ||
        state === "stopped" ||
        state === "error" ||
        state === "unsupported" ||
        state === "interrupted"
      ) {
        setInternalSpeechActive(false);
      }
    };

    const handleVoiceSettings = (e) => {
      const settings = e.detail || getVoiceNotificationSettings();
      setVoiceSettings(settings);
      if (settings.enabled !== undefined) {
        setInternalVoiceEnabled(Boolean(settings.enabled));
      }
    };

    window.addEventListener("careconnect-speech-status", handleSpeechStatus);
    window.addEventListener("careconnect-voice-settings", handleVoiceSettings);

    return () => {
      window.removeEventListener("careconnect-speech-status", handleSpeechStatus);
      window.removeEventListener("careconnect-voice-settings", handleVoiceSettings);
    };
  }, []);

  const isSpeakingNow =
    isSpeechActiveProp !== undefined ? isSpeechActiveProp : internalSpeechActive;
  const isVoiceOn =
    voiceEnabledProp !== undefined ? voiceEnabledProp : internalVoiceEnabled;

  const handleStopSpeaking = () => {
    stopSpeaking();
    setInternalSpeechActive(false);
    if (onStopSpeech) {
      onStopSpeech();
    }
  };

  const handleToggleVoice = () => {
    if (onToggleVoice) {
      onToggleVoice();
    } else {
      const next = !voiceSettings.enabled;
      const updated = saveVoiceNotificationSettings({ enabled: next });
      setVoiceSettings(updated);
      setInternalVoiceEnabled(next);
      if (!next) {
        stopSpeaking();
        setInternalSpeechActive(false);
      }
    }
  };

  const handleToggleMedicinesVoice = (e) => {
    e?.stopPropagation();
    const next = !voiceSettings.medicinesEnabled;
    const updated = saveVoiceNotificationSettings({ medicinesEnabled: next });
    setVoiceSettings(updated);
    speakText(
      next
        ? (profile?.preferred_language === "Telugu"
            ? "మందుల వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి."
            : "Medicine voice reminders turned on.")
        : (profile?.preferred_language === "Telugu"
            ? "మందుల వాయిస్ రిమైండర్లు ఆపివేయబడ్డాయి."
            : "Medicine voice reminders turned off."),
      profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN",
      profile?.voice_speed || 1
    );
  };

  const handleToggleAppointmentsVoice = (e) => {
    e?.stopPropagation();
    const next = !voiceSettings.appointmentsEnabled;
    const updated = saveVoiceNotificationSettings({ appointmentsEnabled: next });
    setVoiceSettings(updated);
    speakText(
      next
        ? (profile?.preferred_language === "Telugu"
            ? "అపాయింట్‌మెంట్ వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి."
            : "Appointment voice reminders turned on.")
        : (profile?.preferred_language === "Telugu"
            ? "అపాయింట్‌మెంట్ వాయిస్ రిమైండర్లు ఆపివేయబడ్డాయి."
            : "Appointment voice reminders turned off."),
      profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN",
      profile?.voice_speed || 1
    );
  };

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
    clearCareConnectSession();
    navigate("/login", { replace: true });
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
          aria-expanded={sidebarOpen}
          aria-controls="elder-navigation-sidebar"
        >
          <FaBars />
        </button>

        <Link
          className="elder-brand"
          to="/elder/dashboard"
          aria-label="CareConnect elder dashboard home"
        >
          <img src={logo} alt="CareConnect" className="elder-header-logo" />
          <div className="elder-brand-text">
            <h2>CareConnect</h2>
            <span>Care. Connect. Always.</span>
          </div>
        </Link>
      </div>

      {/* =================================================
          RIGHT SIDE: Notifications & Profile
      ================================================= */}
      <div className="elder-header-right">
        {/* Stop Voice button: prominently displayed when voice is speaking */}
        {isSpeakingNow && (
          <button
            type="button"
            className="elder-header-stop-speech-btn"
            onClick={handleStopSpeaking}
            title="Stop voice speech immediately"
            aria-label="Stop speaking voice notification"
          >
            <span className="elder-stop-speech-pulse" aria-hidden="true" />
            <FaStop />
            <span>Stop Voice</span>
          </button>
        )}

        {/* Quick Voice notifications toggle & settings dropdown */}
        <div className="elder-header-voice-wrapper">
          <button
            type="button"
            className={`elder-header-voice-btn ${isVoiceOn ? "active" : "muted"}`}
            onClick={() => setShowVoiceMenu((prev) => !prev)}
            title="Voice Reminders: Click to manage medicines and appointments voice speech"
            aria-label="Manage voice reminders"
            aria-expanded={showVoiceMenu}
          >
            {isVoiceOn ? <FaVolumeHigh /> : <FaVolumeXmark />}
            <span className="elder-header-voice-btn-text">
              {isVoiceOn ? "Voice On" : "Voice Off"}
            </span>
          </button>

          {showVoiceMenu && (
            <div className="elder-voice-menu-dropdown" role="menu">
              <div className="elder-voice-menu-header">
                <strong>Voice Reminders</strong>
                <button
                  type="button"
                  className="elder-voice-menu-close"
                  onClick={() => setShowVoiceMenu(false)}
                  aria-label="Close voice menu"
                >
                  <FaXmark />
                </button>
              </div>

              <div className="elder-voice-menu-item">
                <div className="elder-voice-menu-label">
                  <FaSliders />
                  <div>
                    <span>Master Voice</span>
                    <small>All speech & notifications</small>
                  </div>
                </div>
                <button
                  type="button"
                  className={`elder-voice-pill-btn ${voiceSettings.enabled ? "on" : "off"}`}
                  onClick={handleToggleVoice}
                >
                  {voiceSettings.enabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className="elder-voice-menu-item">
                <div className="elder-voice-menu-label">
                  <FaPills />
                  <div>
                    <span>Medicines Voice</span>
                    <small>Spoken dose reminder alerts</small>
                  </div>
                </div>
                <button
                  type="button"
                  className={`elder-voice-pill-btn ${voiceSettings.medicinesEnabled && voiceSettings.enabled ? "on" : "off"}`}
                  onClick={handleToggleMedicinesVoice}
                  disabled={!voiceSettings.enabled}
                >
                  {voiceSettings.medicinesEnabled && voiceSettings.enabled ? "ON" : "OFF"}
                </button>
              </div>

              <div className="elder-voice-menu-item">
                <div className="elder-voice-menu-label">
                  <FaCalendarCheck />
                  <div>
                    <span>Appointments Voice</span>
                    <small>Spoken doctor visit reminders</small>
                  </div>
                </div>
                <button
                  type="button"
                  className={`elder-voice-pill-btn ${voiceSettings.appointmentsEnabled && voiceSettings.enabled ? "on" : "off"}`}
                  onClick={handleToggleAppointmentsVoice}
                  disabled={!voiceSettings.enabled}
                >
                  {voiceSettings.appointmentsEnabled && voiceSettings.enabled ? "ON" : "OFF"}
                </button>
              </div>
            </div>
          )}
        </div>

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

                      <button
                        type="button"
                        className="elder-dropdown-hear-btn"
                        aria-label={`Listen to notification: ${item.title}`}
                        title="Listen to notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                          const telugu = profile?.preferred_language === "Telugu";
                          const text = notificationAnnouncementText(item, telugu ? "Telugu" : "English", true);
                          speakText(text, telugu ? "te-IN" : "en-IN", profile?.voice_speed || 1, undefined, { voiceName: getVoiceNotificationSettings().voiceName, rememberAsLast: true });
                        }}
                      >
                        <FaVolumeHigh />
                      </button>
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
        <div className="elder-profile-wrapper" onMouseLeave={() => setShowProfileMenu(false)}>
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

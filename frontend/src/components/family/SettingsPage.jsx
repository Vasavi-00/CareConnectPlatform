import React, { useState } from "react";
import {
  FaGear,
  FaUser,
  FaLock,
  FaBell,
  FaCalendarCheck,
  FaPills,
  FaRobot,
  FaEnvelope,
  FaChartLine,
  FaShieldHeart,
  FaMobileScreenButton,
  FaRightFromBracket,
  FaFloppyDisk,
  FaChevronRight,
} from "react-icons/fa6";

import "../../styles/family/SettingsPage.css";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    medicine: true,
    appointments: true,
    emergency: true,
    companion: true,
  });

  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    weeklySummary: true,
    compactView: false,
  });

  const [saved, setSaved] = useState(false);

  const toggleNotification = (name) => {
    setNotifications((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));

    setSaved(false);
  };

  const togglePreference = (name) => {
    setPreferences((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));

    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="settings-page">

      {/* PAGE HEADING */}
      <section className="settings-hero">
        <div className="settings-hero-left">
          <div className="settings-hero-icon">
            <FaGear />
          </div>

          <div>
            <h1>Settings</h1>
            <p>
              Manage your dashboard, notifications and account preferences.
            </p>
          </div>
        </div>

        <div className="settings-hero-right">
          <span>“Make CareConnect work</span>
          <span>the way you care.”</span>
        </div>
      </section>


      {/* ACCOUNT SETTINGS */}
      <section className="settings-account-card">

        <div className="settings-section-header">
          <div>
            <h2>
              <FaUser />
              Account Settings
            </h2>

            <p>
              Manage your account information and security.
            </p>
          </div>
        </div>

        <div className="account-settings-list">

          <div className="account-setting-item">

            <div className="account-setting-icon blue">
              <FaUser />
            </div>

            <div className="account-setting-content">
              <strong>Profile Information</strong>
              <span>
                Update your name, email address and contact information.
              </span>
            </div>

            <button className="settings-action-button">
              Edit Profile
              <FaChevronRight />
            </button>

          </div>


          <div className="account-setting-item">

            <div className="account-setting-icon purple">
              <FaLock />
            </div>

            <div className="account-setting-content">
              <strong>Password & Security</strong>
              <span>
                Change your password and manage account security.
              </span>
            </div>

            <button className="settings-action-button">
              Change Password
              <FaChevronRight />
            </button>

          </div>

        </div>

      </section>


      {/* NOTIFICATIONS + DASHBOARD */}
      <section className="settings-two-column">

        {/* NOTIFICATIONS */}
        <div className="notification-settings-card">

          <div className="settings-section-header">

            <div>
              <h2>
                <FaBell />
                Notifications
              </h2>

              <p>
                Choose which alerts you want to receive.
              </p>
            </div>

          </div>


          <div className="settings-toggle-list">

            <ToggleSetting
              icon={<FaPills />}
              iconClass="green"
              title="Medicine Reminders"
              description="Receive reminders for medicines."
              enabled={notifications.medicine}
              onClick={() => toggleNotification("medicine")}
            />

            <ToggleSetting
              icon={<FaCalendarCheck />}
              iconClass="blue"
              title="Appointment Alerts"
              description="Get notified about upcoming appointments."
              enabled={notifications.appointments}
              onClick={() => toggleNotification("appointments")}
            />

            <ToggleSetting
              icon={<FaShieldHeart />}
              iconClass="orange"
              title="Emergency Alerts"
              description="Receive important emergency notifications."
              enabled={notifications.emergency}
              onClick={() => toggleNotification("emergency")}
            />

            <ToggleSetting
              icon={<FaRobot />}
              iconClass="purple"
              title="AI Companion Alerts"
              description="Receive important companion insights."
              enabled={notifications.companion}
              onClick={() => toggleNotification("companion")}
            />

          </div>

        </div>


        {/* DASHBOARD PREFERENCES */}
        <div className="dashboard-preferences-card">

          <div className="settings-section-header">

            <div>
              <h2>
                <FaChartLine />
                Dashboard Preferences
              </h2>

              <p>
                Customize how information appears on your dashboard.
              </p>
            </div>

          </div>


          <div className="settings-toggle-list">

            <ToggleSetting
              icon={<FaEnvelope />}
              iconClass="blue"
              title="Email Updates"
              description="Receive important updates by email."
              enabled={preferences.emailUpdates}
              onClick={() => togglePreference("emailUpdates")}
            />

            <ToggleSetting
              icon={<FaChartLine />}
              iconClass="green"
              title="Weekly Summary"
              description="Receive a weekly care summary."
              enabled={preferences.weeklySummary}
              onClick={() => togglePreference("weeklySummary")}
            />

            <ToggleSetting
              icon={<FaMobileScreenButton />}
              iconClass="purple"
              title="Compact View"
              description="Use a more compact dashboard layout."
              enabled={preferences.compactView}
              onClick={() => togglePreference("compactView")}
            />

          </div>

        </div>

      </section>


      {/* PRIVACY & SECURITY */}
      <section className="privacy-card">

        <div className="settings-section-header">

          <div>
            <h2>
              <FaShieldHeart />
              Privacy & Security
            </h2>

            <p>
              Manage access and connected services.
            </p>
          </div>

        </div>


        <div className="privacy-list">

          <PrivacyItem
            icon={<FaShieldHeart />}
            title="Family Data Sharing"
            description="Manage what information is shared with family members."
            button="Manage"
          />

          <PrivacyItem
            icon={<FaMobileScreenButton />}
            title="Connected Devices"
            description="View devices currently connected to CareConnect."
            button="Manage"
          />

          <PrivacyItem
            icon={<FaLock />}
            title="Login Sessions"
            description="Review active sessions and account access."
            button="View"
          />

        </div>

      </section>


      {/* SAVE */}
      <div className="settings-save-area">

        {saved && (
          <span className="settings-saved-message">
            ✓ Changes saved successfully
          </span>
        )}

        <button
          className="settings-save-button"
          onClick={handleSave}
        >
          <FaFloppyDisk />
          Save Changes
        </button>

      </div>


      {/* DANGER ZONE */}
      <section className="logout-card">

        <div className="logout-icon">
          <FaRightFromBracket />
        </div>

        <div className="logout-content">
          <h3>Sign Out</h3>
          <p>
            Sign out of your CareConnect family account on this device.
          </p>
        </div>

        <button className="logout-button">
          Sign Out
        </button>

      </section>

    </div>
  );
}


/* =========================================================
   TOGGLE COMPONENT
========================================================= */

function ToggleSetting({
  icon,
  iconClass,
  title,
  description,
  enabled,
  onClick,
}) {
  return (
    <div className="toggle-setting">

      <div className={`toggle-setting-icon ${iconClass}`}>
        {icon}
      </div>

      <div className="toggle-setting-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`toggle-switch ${enabled ? "active" : ""}`}
        onClick={onClick}
        aria-label={`Toggle ${title}`}
        aria-pressed={enabled}
      >
        <span></span>
      </button>

    </div>
  );
}


/* =========================================================
   PRIVACY ITEM
========================================================= */

function PrivacyItem({
  icon,
  title,
  description,
  button,
}) {
  return (
    <div className="privacy-item">

      <div className="privacy-icon">
        {icon}
      </div>

      <div className="privacy-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button className="privacy-action">
        {button}
        <FaChevronRight />
      </button>

    </div>
  );
}
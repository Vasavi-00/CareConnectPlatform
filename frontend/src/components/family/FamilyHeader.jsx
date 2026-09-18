import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaBars,
  FaPlus,
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
  FaCircleQuestion,
  FaArrowRightFromBracket,
} from "react-icons/fa6";

import logo from "../../assets/images/logo.png";

import {
  sendConnectionRequest,
} from "../../services/api/familyApi";

import "../../styles/family/FamilyHeader.css";


export default function FamilyHeader({
  sidebarOpen,
  setSidebarOpen,
  user,
  onElderConnected,
}) {

  const navigate = useNavigate();


  // =====================================================
  // USER
  // =====================================================

  const firstName =
    user?.first_name || "Family Member";

  const fullName =
    `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
    "Family Member";

  const avatarLetter =
    (user?.first_name || user?.email || "F")
      .charAt(0)
      .toUpperCase();


  // =====================================================
  // ADD ELDER
  // =====================================================

  const [showAddElder, setShowAddElder] =
    useState(false);

  const [elderCode, setElderCode] =
    useState("");

  const [elderAdded, setElderAdded] =
    useState(false);

  const [connecting, setConnecting] =
    useState(false);

  const [connectionError, setConnectionError] =
    useState("");


  // =====================================================
  // PROFILE
  // =====================================================

  const [showProfileMenu, setShowProfileMenu] =
    useState(false);


  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [notifications, setNotifications] =
    useState([
      {
        id: 1,
        type: "medicine",
        icon: <FaPills />,
        title: "Medicine Reminder",
        message:
          "Your parent's evening medicine is due at 8:00 PM.",
        time: "10 min ago",
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
        unread: false,
      },
    ]);


  // =====================================================
  // UNREAD COUNT
  // =====================================================

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;


  // =====================================================
  // MARK NOTIFICATION AS READ
  // =====================================================

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
      )
    );
  };


  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        unread: false,
      }))
    );
  };


  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const deleteNotification = (id) => {
    setNotifications((prev) =>
      prev.filter(
        (notification) =>
          notification.id !== id
      )
    );
  };


  // =====================================================
  // OPEN ADD ELDER
  // =====================================================

  const openAddElder = () => {
    setElderCode("");
    setElderAdded(false);
    setConnectionError("");
    setShowAddElder(true);
  };


  // =====================================================
  // CLOSE ADD ELDER
  // =====================================================

  const closeAddElder = () => {
    if (connecting) return;

    setShowAddElder(false);
    setElderCode("");
    setElderAdded(false);
    setConnectionError("");
  };


  // =====================================================
  // CONNECT ELDER
  // =====================================================

  const handleConnectElder = async (event) => {
    event.preventDefault();

    const trimmedCode =
      elderCode.trim();

    if (!trimmedCode) {
      setConnectionError(
        "Please enter the elder's CareConnect ID."
      );
      return;
    }

    try {
      setConnecting(true);
      setConnectionError("");

      /*
        Send connection request to backend.

        familyApi.js:
        sendConnectionRequest(
          careconnectId,
          relationshipType
        )
      */

      await sendConnectionRequest(
        trimmedCode
      );

      /*
        Request was successfully created.
      */

      setElderAdded(true);

      /*
        Refresh connected elders in
        FamilyDashboard.

        Note:
        The elder will appear in the dashboard
        only after the elder accepts the request
        if the backend uses approval flow.
      */

      if (onElderConnected) {
        await onElderConnected();
      }

    } catch (error) {
      console.error(
        "Connect elder error:",
        error
      );

      setConnectionError(
        error.message ||
          "Unable to send connection request."
      );

    } finally {
      setConnecting(false);
    }
  };


  return (
    <header className="family-header">

      {/* =================================================
          LEFT SIDE
      ================================================= */}

      <div className="header-left">

        {/* Hamburger */}

        <button
          type="button"
          className="header-menu-button"
          onClick={() =>
            setSidebarOpen(
              (prev) => !prev
            )
          }
          aria-label={
            sidebarOpen
              ? "Close sidebar"
              : "Open sidebar"
          }
        >
          <FaBars />
        </button>


        {/* CareConnect Brand */}

        <div className="header-brand">

          <img
            src={logo}
            alt="CareConnect"
            className="header-logo"
          />

          <div className="header-brand-text">

            <h2>
              CareConnect
            </h2>

            <span>
              Care. Connect. Always.
            </span>

          </div>

        </div>

      </div>


      {/* =================================================
          RIGHT SIDE
      ================================================= */}

      <div className="header-actions">


        {/* =================================================
            ADD ELDER
        ================================================= */}

        <button
          type="button"
          className="add-elder-button"
          onClick={openAddElder}
        >
          <FaPlus />
          Add Elder
        </button>


        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <div className="notification-wrapper">

          <button
            type="button"
            className="notification-btn"
            onClick={() =>
              setShowNotifications(
                (prev) => !prev
              )
            }
            aria-label="Notifications"
          >

            <FaBell />

            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}

          </button>


          {/* Notification Popup */}

          {showNotifications && (

            <div className="notification-dropdown">


              {/* Popup Header */}

              <div className="notification-header">

                <div>

                  <h3>
                    Notifications
                  </h3>

                  <span>
                    {unreadCount} unread
                  </span>

                </div>


                {unreadCount > 0 && (

                  <button
                    type="button"
                    className="mark-all-button"
                    onClick={markAllAsRead}
                  >
                    <FaCheck />
                    Mark all read
                  </button>

                )}

              </div>


              {/* Notification List */}

              <div className="notification-list">

                {notifications.length === 0 ? (

                  <div className="no-notifications">

                    <FaBell />

                    <h4>
                      No notifications
                    </h4>

                    <p>
                      You're all caught up.
                    </p>

                  </div>

                ) : (

                  notifications.map(
                    (notification) => (

                      <div
                        key={notification.id}
                        className={`notification-item ${
                          notification.unread
                            ? "unread"
                            : ""
                        }`}
                        onClick={() =>
                          markAsRead(
                            notification.id
                          )
                        }
                      >

                        {/* Icon */}

                        <div
                          className={`notification-icon ${notification.type}`}
                        >
                          {notification.icon}
                        </div>


                        {/* Content */}

                        <div className="notification-content">

                          <div className="notification-title-row">

                            <h4>
                              {notification.title}
                            </h4>

                            {notification.unread && (
                              <span className="unread-dot"></span>
                            )}

                          </div>


                          <p>
                            {notification.message}
                          </p>


                          <span className="notification-time">
                            {notification.time}
                          </span>

                        </div>


                        {/* Delete */}

                        <button
                          type="button"
                          className="delete-notification"
                          onClick={(e) => {
                            e.stopPropagation();

                            deleteNotification(
                              notification.id
                            );
                          }}
                          aria-label="Delete notification"
                        >
                          <FaTrash />
                        </button>

                      </div>

                    )
                  )

                )}

              </div>


              {/* View All Notifications */}

              <button
                type="button"
                className="view-all-notifications"
                onClick={() => {
                  setShowNotifications(false);

                  navigate(
                    "/dashboard/family/notifications"
                  );
                }}
              >
                View All Notifications
              </button>

            </div>

          )}

        </div>


        {/* =================================================
            PROFILE
        ================================================= */}

        <div className="profile-wrapper">

          <button
            type="button"
            className="header-profile"
            onClick={() =>
              setShowProfileMenu(
                (prev) => !prev
              )
            }
          >

            <div className="profile-avatar">
              {avatarLetter}
            </div>


            <div className="profile-info">

              <strong>
                Hi, {firstName}
              </strong>

              <span>
                Family Member
              </span>

            </div>


            <FaChevronDown
              className={`profile-arrow ${
                showProfileMenu
                  ? "profile-arrow-open"
                  : ""
              }`}
            />

          </button>


          {/* Profile Dropdown */}

          {showProfileMenu && (

            <div className="profile-dropdown">


              {/* User */}

              <div className="profile-dropdown-user">

                <div className="profile-dropdown-avatar">
                  {avatarLetter}
                </div>

                <div>

                  <strong>
                    {fullName}
                  </strong>

                  <span>
                    Family Member
                  </span>

                </div>

              </div>


              <div className="profile-dropdown-divider"></div>


              {/* Parent Profile */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  navigate(
                    "/dashboard/family/profile"
                  );
                }}
              >
                <FaUser />

                <span>
                  Parent Profile
                </span>
              </button>


              {/* Settings */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  navigate(
                    "/dashboard/family/settings"
                  );
                }}
              >
                <FaGear />

                <span>
                  Settings
                </span>
              </button>


              {/* Help */}

              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);

                  navigate(
                    "/dashboard/family/help"
                  );
                }}
              >
                <FaCircleQuestion />

                <span>
                  Help & Support
                </span>
              </button>


              <div className="profile-dropdown-divider"></div>


              {/* Sign Out */}

              <button
                type="button"
                className="profile-signout"
                onClick={() => {
                  setShowProfileMenu(false);

                  alert(
                    "Sign out functionality will be connected to the backend."
                  );
                }}
              >

                <FaArrowRightFromBracket />

                <span>
                  Sign Out
                </span>

              </button>

            </div>

          )}

        </div>

      </div>


      {/* =================================================
          ADD ELDER POPUP
      ================================================= */}

      {showAddElder && (

        <div
          className="add-elder-overlay"
          onClick={closeAddElder}
        >

          <div
            className="add-elder-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* Modal Header */}

            <div className="add-elder-modal-header">

              <div>

                <h2>
                  Add Elder
                </h2>

                <p>
                  Connect an elder to your
                  CareConnect family account.
                </p>

              </div>


              <button
                type="button"
                className="add-elder-close"
                onClick={closeAddElder}
                disabled={connecting}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =================================================
                CONNECTION FORM
            ================================================= */}

            {!elderAdded ? (

              <form
                onSubmit={handleConnectElder}
              >


                {/* Elder Code */}

                <div className="elder-code-field">

                  <label>
                    Elder CareConnect ID
                  </label>

                  <input
                    type="text"
                    value={elderCode}
                    onChange={(e) => {
                      setElderCode(
                        e.target.value.toUpperCase()
                      );

                      setConnectionError("");
                    }}
                    placeholder="CC-XXXX-XXXX"
                    autoFocus
                    disabled={connecting}
                  />

                  <span>
                    Enter the unique CareConnect ID
                    provided by the elder.
                  </span>

                </div>


                {/* Information */}

                <div className="add-elder-info">

                  <FaCircleInfo />

                  <p>
                    A connection request will be
                    sent to the elder. The elder may
                    need to accept the request before
                    their information becomes visible
                    on your dashboard.
                  </p>

                </div>


                {/* Error */}

                {connectionError && (

                  <div className="add-elder-error">
                    {connectionError}
                  </div>

                )}


                {/* Actions */}

                <div className="add-elder-modal-actions">

                  <button
                    type="button"
                    className="elder-cancel-button"
                    onClick={closeAddElder}
                    disabled={connecting}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="elder-submit-button"
                    disabled={connecting}
                  >

                    <FaPlus />

                    {connecting
                      ? "Sending..."
                      : "Connect Elder"}

                  </button>

                </div>

              </form>

            ) : (

              /* =================================================
                 SUCCESS
              ================================================= */

              <div className="elder-success">

                <div className="elder-success-icon">
                  ✓
                </div>

                <h3>
                  Connection Request Sent
                </h3>

                <p>
                  Your request has been sent
                  successfully. The elder needs to
                  accept the request before the
                  connection becomes active.
                </p>

                <button
                  type="button"
                  className="elder-done-button"
                  onClick={closeAddElder}
                >
                  Done
                </button>

              </div>

            )}

          </div>

        </div>

      )}

    </header>
  );
}

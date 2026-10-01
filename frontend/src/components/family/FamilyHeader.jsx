import React, { useCallback, useEffect, useState } from "react";
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
  FaUser,
  FaGear,
  FaCircleQuestion,
  FaArrowRightFromBracket,
} from "react-icons/fa6";

import logo from "../../assets/images/logo.png";

import {
  getNotifications,
  markNotificationRead,
  connectElder,
} from "../../services/api/familyApi";

import "../../styles/family/FamilyHeader.css";


export default function FamilyHeader({
  sidebarOpen,
  setSidebarOpen,
  user,
  elders = [],
  selectedElder,
  onSelectElder,
  onElderConnected,
  onRegisterAddElder,
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

  const [showElderSwitcher, setShowElderSwitcher] =
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

  const [notifications, setNotifications] = useState([]);
  const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;

  const loadNotifications = async () => {
    try {
      const rows = await getNotifications();
      const visible = elderId ? rows.filter((item) => !item.elder || String(item.elder.id) === String(elderId)) : [];
      setNotifications(visible.map((item) => {
        const type = item.notification_type === "MEDICINE" ? "medicine" : item.notification_type === "APPOINTMENT" ? "appointment" : item.notification_type === "AI_SUMMARY" ? "ai" : item.notification_type === "SOS" ? "emergency" : "general";
        const icon = type === "medicine" ? <FaPills /> : type === "appointment" ? <FaCalendarCheck /> : type === "ai" ? <FaRobot /> : type === "emergency" ? <FaTriangleExclamation /> : <FaCircleInfo />;
        return { ...item, type, icon, unread: !item.is_read, time: item.created_at ? new Date(item.created_at).toLocaleString() : "" };
      }));
    } catch (err) { console.error("Family notification load error:", err); }
  };

  useEffect(() => { loadNotifications(); }, [elderId]);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, unread: false, is_read: true } : item));
    } catch (err) { console.error("Failed to mark notification as read:", err); }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(notifications.filter((item) => item.unread).map((item) => markNotificationRead(item.id)));
      setNotifications((prev) => prev.map((item) => ({ ...item, unread: false, is_read: true })));
    } catch (err) { console.error("Failed to mark notifications as read:", err); }
  };

  const getElderName = (elder) => {
    if (!elder) return "Elder";
    if (elder.elder_name) return elder.elder_name;
    if (elder.name) return elder.name;
    if (elder.first_name || elder.last_name) {
      return `${elder.first_name || ""} ${elder.last_name || ""}`.trim();
    }
    if (elder.careconnect_id || elder.careconnectId) {
      return elder.careconnect_id || elder.careconnectId;
    }
    return "Elder";
  };

  const handleLogout = () => {
    localStorage.removeItem("careconnect_access");
    localStorage.removeItem("careconnect_refresh");
    localStorage.removeItem("careconnect_user");
    setShowProfileMenu(false);
    navigate("/login", { replace: true });
  };



  // =====================================================
  // OPEN ADD ELDER
  // =====================================================

  const openAddElder = useCallback(() => {
    setElderCode("");
    setElderAdded(false);
    setConnectionError("");
    setShowAddElder(true);
  }, []);

  useEffect(() => {
    onRegisterAddElder?.(openAddElder);
    return () => onRegisterAddElder?.(null);
  }, [onRegisterAddElder, openAddElder]);


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

      await connectElder(trimmedCode);

      setElderAdded(true);

      // Reload the dashboard data now that the relationship exists.

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
          "Unable to connect this elder."
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


        {Array.isArray(elders) && elders.length > 1 && (
          <div
            className="elder-switcher-wrapper"
            onMouseLeave={() => setShowElderSwitcher(false)}
          >
            <button
              type="button"
              className="elder-switcher-button"
              onClick={() => setShowElderSwitcher((prev) => !prev)}
            >
              <FaUser />
              <span>
                {selectedElder ? getElderName(selectedElder) : "Switch Elder"}
              </span>
              <FaChevronDown className={`elder-switcher-chevron ${showElderSwitcher ? "open" : ""}`} />
            </button>

            {showElderSwitcher && (
              <div className="elder-switcher-menu">
                {elders.map((elder) => {
                  const elderIdValue = elder?.elder_id || elder?.id || elder?.careconnect_id || elder?.careconnectId;
                  // Compare one stable identifier at a time. Comparing optional
                  // fields with `===` can mark every elder active when both
                  // objects omit that field (undefined === undefined).
                  const selectedId =
                    selectedElder?.elder_id ??
                    selectedElder?.elder?.id ??
                    selectedElder?.id;
                  const optionId =
                    elder?.elder_id ?? elder?.elder?.id ?? elder?.id;
                  const selectedCareConnectId =
                    selectedElder?.careconnect_id ||
                    selectedElder?.careconnectId ||
                    selectedElder?.elder?.careconnect_id ||
                    selectedElder?.elder?.careconnectId;
                  const optionCareConnectId =
                    elder?.careconnect_id ||
                    elder?.careconnectId ||
                    elder?.elder?.careconnect_id ||
                    elder?.elder?.careconnectId;
                  const isActive = Boolean(
                    (selectedId != null && optionId != null && String(selectedId) === String(optionId)) ||
                    (selectedCareConnectId && optionCareConnectId &&
                      String(selectedCareConnectId) === String(optionCareConnectId))
                  );

                  return (
                    <button
                      key={elderIdValue || getElderName(elder)}
                      type="button"
                      className={`elder-switcher-option ${isActive ? "active" : ""}`}
                      onClick={() => {
                        if (typeof onSelectElder === "function") {
                          onSelectElder(elder);
                        }
                        setShowElderSwitcher(false);
                      }}
                    >
                      <span>{getElderName(elder)}</span>
                      {isActive && <FaCheck />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

        <div
          className="notification-wrapper"
          onMouseLeave={() => setShowNotifications(false)}
        >

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

        <div className="family-profile-wrapper" onMouseLeave={() => setShowProfileMenu(false)}>
          <button
            type="button"
            className="family-profile-btn"
            onClick={() => setShowProfileMenu((prev) => !prev)}
            aria-label="Family profile menu"
            aria-expanded={showProfileMenu}
          >
            <div className="family-avatar-circle">{avatarLetter}</div>
            <div className="family-profile-meta">
              <strong>Hi, {firstName}</strong>
              <span>Family Member</span>
            </div>
            <FaChevronDown className={`family-chevron ${showProfileMenu ? "open" : ""}`} />
          </button>

          {showProfileMenu && (
            <div className="family-profile-dropdown">
              <div className="family-profile-dropdown-header">
                <div className="family-avatar-circle large">{avatarLetter}</div>
                <div>
                  <strong>{fullName}</strong>
                  <span className="family-role-pill">Family Account</span>
                  {user?.email && <small className="family-email-text">{user.email}</small>}
                </div>
              </div>

              <div className="family-profile-dropdown-links">
                <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/dashboard/family/profile"); }}>
                  <FaUser /> Parent Profile
                </button>
                <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/dashboard/family/settings"); }}>
                  <FaGear /> Settings
                </button>
                <button type="button" onClick={() => { setShowProfileMenu(false); navigate("/dashboard/family/help"); }}>
                  <FaCircleQuestion /> Help & Support
                </button>
                <button type="button" className="family-logout-link" onClick={handleLogout}>
                  <FaArrowRightFromBracket /> Sign Out
                </button>
              </div>
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
                    The elder will be connected to
                    your family dashboard immediately
                    after their CareConnect ID is verified.
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
                      ? "Connecting..."
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
                  Elder connected successfully.
                  Their profile is now available
                  on your family dashboard.
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

import React from "react";
import { NavLink } from "react-router-dom";
import useFocusTrap from "../../hooks/useFocusTrap";

import {
  FaHouse,
  FaCalendarCheck,
  FaPills,
  FaRobot,
  FaBell,
  FaHeart,
  FaTriangleExclamation,
  FaUser,
} from "react-icons/fa6";

import sidebarCare from "../../assets/images/sidebar-care.png";
import "../../styles/family/FamilySidebar.css";

export default function ElderSidebar({
  sidebarOpen,
  isMobile,
  unreadCount = 0,
  onNavigate,
}) {
  const isMobileDevice =
    isMobile ?? (typeof window !== "undefined" && window.innerWidth <= 800);
  const sidebarRef = useFocusTrap(sidebarOpen && isMobileDevice);

  return (
    <aside
      ref={sidebarRef}
      id="elder-navigation-sidebar"
      className={`family-sidebar elder-sidebar ${
        sidebarOpen ? "open" : "closed"
      }`}
      aria-label="Elder dashboard navigation"
      aria-hidden={!sidebarOpen}
    >
      {/* ==========================================
          NAVIGATION
          ========================================== */}
      <nav className="sidebar-navigation" inert={!sidebarOpen}>
        <NavLink
          to="/elder/dashboard"
          end
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaHouse />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/elder/appointments"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaCalendarCheck />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/elder/medicines"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaPills />
          <span>Medicine</span>
        </NavLink>

        <NavLink
          to="/elder/ai"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaRobot />
          <span>AI Companion</span>
        </NavLink>

        <NavLink
          to="/elder/notifications"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaBell />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="sidebar-nav-badge">{unreadCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/elder/family"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaHeart />
          <span>Family</span>
        </NavLink>

        <NavLink
          to="/elder/sos"
          className="sidebar-nav-link sidebar-nav-link-sos"
          onClick={onNavigate}
        >
          <FaTriangleExclamation />
          <span>Emergency SOS</span>
        </NavLink>

        <NavLink
          to="/elder/profile"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaUser />
          <span>Profile</span>
        </NavLink>
      </nav>

      {/* ==========================================
          SIDEBAR ILLUSTRATION
          ========================================== */}
      <div>
        <center>
          <img
            src={sidebarCare}
            alt="Elder and caregiver"
            className="sidebar-care-image"
          />
        </center>
      </div>
    </aside>
  );
}


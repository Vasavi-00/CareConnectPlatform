import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHouse,
  FaPills,
  FaCalendarCheck,
  FaHeart,
  FaBell,
  FaRobot,
  FaTriangleExclamation,
  FaUser,
} from "react-icons/fa6";

import sidebarCare from "../../assets/images/sidebar-care.png";

export default function ElderSidebar({
  sidebarOpen,
  unreadCount = 0,
  onTriggerSos,
}) {
  return (
    <aside className={`elder-sidebar ${sidebarOpen ? "open" : "closed"}`}>
      <nav className="elder-sidebar-nav">
        <NavLink
          to="/elder/dashboard"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaHouse className="elder-nav-icon" />
          <span className="elder-nav-label">Home</span>
        </NavLink>

        <NavLink
          to="/elder/medicines"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaPills className="elder-nav-icon" />
          <span className="elder-nav-label">My Medicines</span>
        </NavLink>

        <NavLink
          to="/elder/appointments"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaCalendarCheck className="elder-nav-icon" />
          <span className="elder-nav-label">My Appointments</span>
        </NavLink>

        <NavLink
          to="/elder/family"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaHeart className="elder-nav-icon" />
          <span className="elder-nav-label">My Family</span>
        </NavLink>

        <NavLink
          to="/elder/notifications"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaBell className="elder-nav-icon" />
          <span className="elder-nav-label">Notifications</span>
          {unreadCount > 0 && (
            <span className="elder-nav-badge">{unreadCount}</span>
          )}
        </NavLink>

        <NavLink
          to="/elder/ai"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaRobot className="elder-nav-icon" />
          <span className="elder-nav-label">AI Companion</span>
        </NavLink>

        <NavLink
          to="/elder/sos"
          className={({ isActive }) =>
            `elder-nav-item sos-nav-item ${isActive ? "active" : ""}`
          }
          onClick={(e) => {
            if (onTriggerSos) {
              // Optionally trigger the SOS confirm modal directly
            }
          }}
        >
          <FaTriangleExclamation className="elder-nav-icon sos-icon-alert" />
          <span className="elder-nav-label">Emergency SOS</span>
        </NavLink>

        <NavLink
          to="/elder/profile"
          className={({ isActive }) =>
            `elder-nav-item ${isActive ? "active" : ""}`
          }
        >
          <FaUser className="elder-nav-icon" />
          <span className="elder-nav-label">My Profile</span>
        </NavLink>
      </nav>

      <div>
        <img
          src={sidebarCare}
          alt="Care and comfort"
          className="elder-sidebar-care-img"
        />
        <span className="elder-sidebar-tagline">
          Care • Connect • Always
        </span>
      </div>
    </aside>
  );
}

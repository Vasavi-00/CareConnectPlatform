import React from "react";
import { NavLink } from "react-router-dom";
import useFocusTrap from "../../hooks/useFocusTrap";

import {
  FaHouse,
  FaCalendarCheck,
  FaPills,
  FaRobot,
  FaUser,
  FaGear,
  FaBell,
  FaCircleQuestion,
} from "react-icons/fa6";

import sidebarCare from "../../assets/images/sidebar-care.png";

import "../../styles/family/FamilySidebar.css";

export default function FamilySidebar({ sidebarOpen, isMobile, onNavigate }) {
  const sidebarRef = useFocusTrap(sidebarOpen && isMobile);
  return (
    <aside
      ref={sidebarRef}
      id="family-navigation-sidebar"
      className={`family-sidebar ${
        sidebarOpen ? "open" : "closed"
      }`}
      aria-label="Family dashboard navigation"
      aria-hidden={!sidebarOpen}
    >

      {/* ==========================================
          NAVIGATION
          ========================================== */}

      <nav className="sidebar-navigation" inert={!sidebarOpen}>

        <NavLink
          to="/dashboard/family"
          end
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaHouse />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/appointments"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaCalendarCheck />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/medicine"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaPills />
          <span>Medicine</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/ai-companion"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaRobot />
          <span>AI Companion</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/notifications"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaBell />
          <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/profile"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaUser />
          <span>Parent Profile</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/settings"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaGear />
          <span>Settings</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/help"
          className="sidebar-nav-link"
          onClick={onNavigate}
        >
          <FaCircleQuestion />
          <span>Help & Support</span>
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

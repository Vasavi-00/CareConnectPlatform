import React from "react";
import { NavLink } from "react-router-dom";

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

export default function FamilySidebar({ sidebarOpen }) {
  return (
    <aside
      className={`family-sidebar ${
        sidebarOpen ? "open" : "closed"
      }`}
    >

      {/* ==========================================
          NAVIGATION
          ========================================== */}

      <nav className="sidebar-navigation">

        <NavLink
          to="/dashboard/family"
          end
          className="sidebar-nav-link"
        >
          <FaHouse />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/appointments"
          className="sidebar-nav-link"
        >
          <FaCalendarCheck />
          <span>Appointments</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/medicine"
          className="sidebar-nav-link"
        >
          <FaPills />
          <span>Medicine</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/ai-companion"
          className="sidebar-nav-link"
        >
          <FaRobot />
          <span>AI Companion</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/notifications"
          className="sidebar-nav-link"
        >
          <FaBell />
          <span>Notifications</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/profile"
          className="sidebar-nav-link"
        >
          <FaUser />
          <span>Parent Profile</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/settings"
          className="sidebar-nav-link"
        >
          <FaGear />
          <span>Settings</span>
        </NavLink>

        <NavLink
          to="/dashboard/family/help"
          className="sidebar-nav-link"
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
import React from "react";
import {
  FaHome,
  FaPills,
  FaCalendarAlt,
  FaPhoneAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaHeartbeat,
} from "react-icons/fa";

export default function FamilySidebar({
  activeSection,
  onChange,
  user,
}) {
  const menu = [
    {
      id: "overview",
      label: "Overview",
      icon: <FaHome />,
    },
    {
      id: "medicines",
      label: "Medicines",
      icon: <FaPills />,
    },
    {
      id: "appointments",
      label: "Appointments",
      icon: <FaCalendarAlt />,
    },
    {
      id: "emergency",
      label: "Emergency Contacts",
      icon: <FaPhoneAlt />,
    },
    {
      id: "profile",
      label: "My Profile",
      icon: <FaUserCircle />,
    },
  ];

  const logout = () => {
    localStorage.removeItem("careconnect_access");
    localStorage.removeItem("careconnect_refresh");
    localStorage.removeItem("careconnect_user");

    window.location.href = "/login";
  };

  return (
    <aside className="family-sidebar">
      <div className="family-logo">
        <div className="family-logo-icon">
          <FaHeartbeat />
        </div>

        <div>
          <h2>CareConnect</h2>
          <span>Family Care</span>
        </div>
      </div>

      <div className="sidebar-menu">
        <p className="sidebar-label">CARE MANAGEMENT</p>

        {menu.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${
              activeSection === item.id ? "active" : ""
            }`}
            onClick={() => onChange(item.id)}
          >
            <span className="sidebar-item-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">
            {(
              user?.first_name?.[0] ||
              user?.email?.[0] ||
              "R"
            ).toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.first_name ||
                user?.email?.split("@")[0] ||
                "Family Member"}
            </strong>

            <span>Family Member</span>
          </div>
        </div>

        <button
          className="sidebar-logout"
          onClick={logout}
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
}
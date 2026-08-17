import React from "react";
import {
  FaBell,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";

export default function FamilyHeader({
  user,
}) {
  const firstName =
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Rambabu";

  return (
    <header className="family-header">
      <div className="family-header-greeting">
        <span>Family Dashboard</span>

        <h1>
          Hello, {firstName} <b>👋</b>
        </h1>
      </div>

      <div className="family-header-actions">
        <button className="header-search">
          <FaSearch />
        </button>

        <button className="header-notification">
          <FaBell />
          <i />
        </button>

        <div className="header-profile">
          <div className="header-avatar">
            {(
              user?.first_name?.[0] ||
              user?.email?.[0] ||
              "R"
            ).toUpperCase()}
          </div>

          <div className="header-profile-info">
            <strong>
              {user?.first_name ||
                user?.email?.split("@")[0] ||
                "Rambabu"}
            </strong>

            <span>Family Member</span>
          </div>

          <FaChevronDown className="header-chevron" />
        </div>
      </div>
    </header>
  );
}
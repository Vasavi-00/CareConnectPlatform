import React from "react";
import {
  FaHeartbeat,
  FaHome,
} from "react-icons/fa";

export default function ElderHeader({
  user,
  language,
  onLanguageChange,
  onHome,
}) {
  const name =
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Elder";

  return (
    <header className="elder-header">
      <div className="elder-brand">
        <div className="elder-brand-icon">
          <FaHeartbeat />
        </div>

        <div>
          <strong>CareConnect</strong>
          <span>Elder Care</span>
        </div>
      </div>

      <div className="elder-header-actions">
        <button
          type="button"
          className="elder-home-button"
          onClick={onHome}
        >
          <FaHome />
        </button>

        <select
          className="elder-language"
          value={language}
          onChange={(e) =>
            onLanguageChange(
              e.target.value
            )
          }
          aria-label="Language"
        >
          <option value="en">
            English
          </option>

          <option value="te">
            తెలుగు
          </option>
        </select>

        <div className="elder-avatar">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
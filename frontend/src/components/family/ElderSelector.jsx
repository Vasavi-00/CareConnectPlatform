import React from "react";
import {
  FaUserShield,
  FaChevronDown,
  FaCheckCircle,
} from "react-icons/fa";

export default function ElderSelector({
  elders,
  selectedElder,
  onChange,
}) {
  return (
    <section className="elder-manager-card">
      <div className="elder-manager-left">
        <div className="elder-manager-icon">
          <FaUserShield />
        </div>

        <div>
          <span className="section-mini-label">
            CURRENTLY MANAGING
          </span>

          <h2>
            {selectedElder
              ? selectedElder.name ||
                selectedElder.full_name ||
                selectedElder.user?.first_name ||
                selectedElder.user?.email ||
                "Elder"
              : "No elder selected"}
          </h2>

          <p>
            CareConnect ID:{" "}
            <strong>
              {selectedElder?.careconnect_id || "—"}
            </strong>
          </p>
        </div>

        {selectedElder && (
          <div className="elder-active-badge">
            <FaCheckCircle />
            Connected
          </div>
        )}
      </div>

      <div className="elder-dropdown">
        <select
          value={selectedElder?.id || ""}
          onChange={(e) => {
            const elder = elders.find(
              (item) =>
                String(item.id) === e.target.value
            );

            onChange(elder || null);
          }}
        >
          <option value="">
            Select elder
          </option>

          {elders.map((elder) => (
            <option
              key={elder.id}
              value={elder.id}
            >
              {elder.name ||
                elder.full_name ||
                elder.user?.email ||
                `Elder ${elder.id}`}
            </option>
          ))}
        </select>

        <FaChevronDown />
      </div>
    </section>
  );
}
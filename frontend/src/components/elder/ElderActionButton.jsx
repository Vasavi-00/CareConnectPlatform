import React from "react";

export default function ElderActionButton({
  icon,
  title,
  subtitle,
  onClick,
  color = "blue",
}) {
  return (
    <button
      type="button"
      className={`elder-action ${color}`}
      onClick={onClick}
    >
      <div className="elder-action-icon">
        {icon}
      </div>

      <div className="elder-action-content">
        <strong>{title}</strong>

        {subtitle && (
          <span>{subtitle}</span>
        )}
      </div>
    </button>
  );
}
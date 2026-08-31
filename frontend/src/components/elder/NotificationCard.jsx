import React from "react";
import {
  FaBell,
  FaPills,
  FaCalendarAlt,
} from "react-icons/fa";

import VoiceButton from "./VoiceButton";

export default function NotificationCard({
  notification,
  language,
  onRead,
  onSpeak,
}) {
  const icon =
    notification.notification_type ===
    "MEDICINE" ? (
      <FaPills />
    ) : notification.notification_type ===
      "APPOINTMENT" ? (
      <FaCalendarAlt />
    ) : (
      <FaBell />
    );

  const spokenText =
    `${notification.title}. ${notification.message}`;

  return (
    <article
      className={`elder-notification ${
        notification.is_read
          ? ""
          : "unread"
      }`}
    >
      <div className="notification-icon">
        {icon}
      </div>

      <div className="notification-body">
        <span className="elder-small-label">
          {notification.notification_type}
        </span>

        <h3>
          {notification.title}
        </h3>

        <p>
          {notification.message}
        </p>

        {!notification.is_read && (
          <button
            type="button"
            className="mark-read-button"
            onClick={() =>
              onRead(
                notification.id
              )
            }
          >
            {language === "te"
              ? "చదివినట్లు గుర్తించండి"
              : "Mark as read"}
          </button>
        )}
      </div>

      <VoiceButton
        onClick={() =>
          onSpeak(spokenText)
        }
        label={
          language === "te"
            ? "వినండి"
            : "Hear"
        }
      />
    </article>
  );
}
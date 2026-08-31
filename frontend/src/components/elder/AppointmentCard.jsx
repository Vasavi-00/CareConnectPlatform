import React from "react";
import {
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";

import VoiceButton from "./VoiceButton";

export default function AppointmentCard({
  appointment,
  language = "en",
  onSpeak,
}) {
  if (!appointment) {
    return null;
  }

  const date = appointment.appointment_at
    ? new Date(
        appointment.appointment_at
      )
    : null;

  const dateText = date
    ? date.toLocaleDateString(
        language === "te"
          ? "te-IN"
          : "en-IN",
        {
          day: "numeric",
          month: "long",
        }
      )
    : "—";

  const timeText = date
    ? date.toLocaleTimeString(
        language === "te"
          ? "te-IN"
          : "en-IN",
        {
          hour: "numeric",
          minute: "2-digit",
        }
      )
    : "—";

  const doctor =
    appointment.doctor_name ||
    "Doctor";

  const clinic =
    appointment.clinic_name ||
    "Clinic";

  const spokenText =
    language === "te"
      ? `${dateText} తేదీన ${timeText} గంటలకు ${doctor} వద్ద అపాయింట్‌మెంట్ ఉంది.`
      : `You have an appointment with ${doctor} at ${clinic} on ${dateText} at ${timeText}.`;

  return (
    <article className="elder-card appointment-card">
      <div className="elder-card-icon appointment">
        <FaCalendarAlt />
      </div>

      <div className="elder-card-body">
        <span className="elder-small-label">
          {language === "te"
            ? "అపాయింట్‌మెంట్"
            : "APPOINTMENT"}
        </span>

        <h3>{doctor}</h3>

        <p>{clinic}</p>

        <div className="appointment-meta">
          <span>
            <FaCalendarAlt />
            {dateText}
          </span>

          <span>
            <FaClock />
            {timeText}
          </span>
        </div>

        {appointment.reason && (
          <p>
            {appointment.reason}
          </p>
        )}
      </div>

      <div className="elder-card-actions">
        <VoiceButton
          onClick={() =>
            onSpeak?.(spokenText)
          }
          label={
            language === "te"
              ? "వినండి"
              : "Hear"
          }
        />
      </div>
    </article>
  );
}
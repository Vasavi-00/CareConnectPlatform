import React from "react";
import { FaPills, FaClock } from "react-icons/fa";

import VoiceButton from "./VoiceButton";

export default function MedicineCard({
  medicine,
  language = "en",
  onSpeak,
}) {
  // Protect against an undefined/null medicine.
  if (!medicine) {
    return null;
  }

  const times = Array.isArray(medicine.times)
    ? medicine.times
    : [];

  const firstTime =
    times.length > 0 ? times[0] : "";

  const spokenText =
    language === "te"
      ? `${medicine.name || "మందు"} ${
          medicine.dosage || ""
        } మందును ${
          firstTime
            ? `${firstTime} గంటలకు`
            : "సమయానికి"
        } తీసుకోండి.`
      : `Please take ${
          medicine.name || "your medicine"
        }, ${
          medicine.dosage || ""
        } ${
          firstTime
            ? `at ${firstTime}`
            : "at the scheduled time"
        }.`;

  return (
    <article className="elder-card medicine-card">
      <div className="elder-card-icon medicine">
        <FaPills />
      </div>

      <div className="elder-card-body">
        <span className="elder-small-label">
          {language === "te"
            ? "మందు"
            : "MEDICINE"}
        </span>

        <h3>
          {medicine.name || "Medicine"}
        </h3>

        <p>
          {medicine.dosage || "—"}
        </p>

        {firstTime && (
          <div className="medicine-time">
            <FaClock />
            <span>{firstTime}</span>
          </div>
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
import React from "react";
import { FaVolumeUp } from "react-icons/fa";

export default function VoiceButton({
  onClick,
  label = "Hear",
}) {
  return (
    <button
      type="button"
      className="elder-voice-button"
      onClick={onClick}
      aria-label={label}
    >
      <FaVolumeUp />
      <span>{label}</span>
    </button>
  );
}
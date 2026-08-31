import React, {
  useRef,
  useState,
} from "react";
import {
  FaExclamationTriangle,
} from "react-icons/fa";

export default function SOSButton({
  language,
}) {
  const timer = useRef(null);

  const [progress, setProgress] =
    useState(0);

  const [activated, setActivated] =
    useState(false);

  const startPress = () => {
    const start = Date.now();

    timer.current =
      setInterval(() => {
        const elapsed =
          Date.now() - start;

        const percent = Math.min(
          (elapsed / 2000) * 100,
          100
        );

        setProgress(percent);

        if (percent >= 100) {
          clearInterval(
            timer.current
          );

          setActivated(true);
        }
      }, 50);
  };

  const cancelPress = () => {
    clearInterval(
      timer.current
    );

    if (!activated) {
      setProgress(0);
    }
  };

  return (
    <button
      type="button"
      className={`elder-sos ${
        activated ? "activated" : ""
      }`}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
    >
      <div className="sos-progress">
        <div
          style={{
            width: `${progress}%`,
          }}
        />
      </div>

      <FaExclamationTriangle />

      <strong>
        {activated
          ? "SOS ACTIVATED"
          : language === "te"
          ? "SOS"
          : "SOS"}
      </strong>

      {!activated && (
        <span>
          {language === "te"
            ? "2 సెకన్లు నొక్కి ఉంచండి"
            : "Press and hold for 2 seconds"}
        </span>
      )}

      {activated && (
        <span>
          {language === "te"
            ? "అత్యవసర సేవ త్వరలో కనెక్ట్ చేయబడుతుంది"
            : "Emergency service will be connected next"}
        </span>
      )}
    </button>
  );
}
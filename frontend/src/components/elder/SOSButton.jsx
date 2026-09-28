import React, {
  useRef,
  useState,
} from "react";
import {
  FaExclamationTriangle,
} from "react-icons/fa";
import SOSConfirmationModal from "./SOSConfirmationModal";

export default function SOSButton({
  language,
  onActivate,
}) {
  const timer = useRef(null);

  const [progress, setProgress] =
    useState(0);

  const [activated, setActivated] =
    useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);

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

          setConfirming(true);
        }
      }, 50);
  };

  const confirmSOS = async () => {
    try { setSending(true); await onActivate?.(); setActivated(true); setConfirming(false); } finally { setSending(false); }
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
    <>
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
    <SOSConfirmationModal isOpen={confirming} onCancel={() => { setConfirming(false); setProgress(0); }} onConfirm={confirmSOS} sending={sending} />
    </>
  );
}

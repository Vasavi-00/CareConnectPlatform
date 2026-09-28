import React, { useState } from "react";
import {
  FaTriangleExclamation,
  FaPhone,
  FaCheck,
  FaCircleXmark,
} from "react-icons/fa6";
import { activateSOS } from "../../services/api/elderApi";

export default function ElderSOSModal({ isOpen, onClose, onSosActivated }) {
  const [loading, setLoading] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await activateSOS();
      setSosResult(res);

      if (onSosActivated) {
        onSosActivated(res);
      }

      const contact = res?.contact;
      if (contact?.phone) {
        // Direct telephone trigger for real workflow
        window.location.href = `tel:${contact.phone}`;
      }
    } catch (err) {
      console.error("SOS Activation Error:", err);
      setError(
        err?.message ||
          "Could not activate automatic SOS. Please call local emergency services immediately."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="elder-modal-overlay">
      <div className="elder-modal-card sos-modal">
        <div className="sos-modal-top-icon">
          <FaTriangleExclamation />
        </div>

        {!sosResult ? (
          <>
            <h2>Do you need emergency help?</h2>
            <p className="sos-modal-description">
              This will immediately notify your connected family members, create
              an emergency event in CareConnect, and initiate a phone call to your
              priority emergency contact.
            </p>

            {error && (
              <div className="sos-modal-error">
                <FaCircleXmark /> {error}
              </div>
            )}

            <div className="sos-modal-btn-row">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-confirm-sos"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Activating Help..." : "YES, GET HELP"}
              </button>
            </div>
          </>
        ) : (
          <div className="sos-modal-live-status">
            <h2 className="sos-active-heading">🚨 Emergency Help Activated</h2>
            <div className="sos-status-checklist">
              <div className="status-step-done">
                <FaCheck /> Family notified immediately
              </div>
              <div className="status-step-done">
                <FaCheck /> Emergency SOS request registered
              </div>
              {sosResult?.contact ? (
                <div className="status-step-calling">
                  <FaPhone className="phone-pulse" />
                  <span>
                    Calling <strong>{sosResult.contact.name}</strong> (
                    {sosResult.contact.phone})
                  </span>
                </div>
              ) : (
                <div className="status-step-calling">
                  <FaPhone className="phone-pulse" />
                  <span>Family notified. Please call local emergency services.</span>
                </div>
              )}
            </div>

            {sosResult?.contact?.phone && (
              <a
                href={`tel:${sosResult.contact.phone}`}
                className="btn-direct-tel-call"
              >
                <FaPhone /> Tap to Call {sosResult.contact.name} Now
              </a>
            )}

            <button
              type="button"
              className="btn-close-sos-status"
              onClick={onClose}
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

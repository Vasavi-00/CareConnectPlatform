import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaTriangleExclamation, FaPhone, FaCircleXmark, FaSpinner } from "react-icons/fa6";
import { activateSOS, updateSOSLocation, cancelSOS } from "../../services/api/elderApi";
import useFocusTrap from "../../hooks/useFocusTrap";

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const n = Math.floor(Math.random() * 16);
    return (c === "x" ? n : (n & 3) | 8).toString(16);
  });
}

function getTelHref(phone) {
  const normalized = String(phone || "").replace(/[\s()-]/g, "");
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : "";
}

export default function ElderSOSModal({ isOpen, onClose, onSosActivated, emergencyContacts = [] }) {
  const [loading, setLoading] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [error, setError] = useState("");
  const [locationStatus, setLocationStatus] = useState("Trying to get your location…");
  const [cancelError, setCancelError] = useState("");
  const requestInFlight = useRef(false);
  const onSosActivatedRef = useRef(onSosActivated);
  const dialogRef = useFocusTrap(isOpen, onClose);

  useEffect(() => { onSosActivatedRef.current = onSosActivated; }, [onSosActivated]);

  const handleConfirm = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setLoading(true);
    setError("");

    // Start GPS immediately, but never wait for it before creating the emergency.
    const locationPromise = new Promise((resolve) => {
      if (!("geolocation" in navigator) || !window.isSecureContext) return resolve(null);
      try { navigator.geolocation.getCurrentPosition(
        ({ coords, timestamp }) => resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          captured_at: new Date(timestamp || Date.now()).toISOString(),
        }),
        () => resolve(null),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
      ); } catch { resolve(null); }
    });

    try {
      const result = await activateSOS({ request_id: createRequestId() });
      setSosResult(result);
      setLocationStatus("Emergency request saved. Checking location…");
      onSosActivatedRef.current?.(result);
      locationPromise.then(async (location) => {
        if (!location) {
          setLocationStatus("Location unavailable. You can still call for help.");
          return;
        }
        try {
          const updated = await updateSOSLocation(result.id, location);
          setSosResult((current) => current?.id === result.id ? { ...current, ...updated } : current);
          setLocationStatus("Location added to the emergency request.");
        } catch {
          setLocationStatus("Location could not be sent. You can still call for help.");
        }
      });
    } catch (err) {
      setError(err?.message || "The emergency request could not be saved. Call for help now.");
      setLocationStatus("Location does not delay direct calling.");
    } finally {
      setLoading(false);
      requestInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSosResult(null);
      setError("");
      setLocationStatus("Trying to get your location…");
      handleConfirm();
    }
  }, [isOpen, handleConfirm]);

  if (!isOpen) return null;
  const emergencyPhone = sosResult?.emergency_services_phone;
  const contact = sosResult?.contact || emergencyContacts.find((entry) => entry.is_active !== false && entry.can_receive_sos !== false);
  const contactPhone = contact?.phone;
  const contactTelHref = getTelHref(contactPhone);

  return (
    <div className="elder-modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} className="elder-modal-card sos-modal" role="dialog" aria-modal="true" aria-label="Emergency assistance status">
        <div className="sos-modal-top-icon"><FaTriangleExclamation /></div>
        <h2>{sosResult ? "Emergency request saved" : "Emergency help"}</h2>
        <p className="sos-modal-description">Your emergency request is saved without waiting for location. Use a call option below for immediate help.</p>
        {error && <div className="sos-modal-error" role="alert"><FaCircleXmark /> {error}</div>}
        {cancelError && <div className="sos-modal-error" role="alert"><FaCircleXmark /> {cancelError}</div>}
        <div className="sos-status-checklist" aria-live="polite">
          <div>{loading ? <><FaSpinner className="sos-loading-spinner" /> Saving emergency request…</> : sosResult ? "Emergency request registered." : "You can call while the request is saving."}</div>
          {sosResult && <div>{sosResult.notification_recipient_count > 0
            ? `In-app alert saved for ${sosResult.notification_recipient_count} authorized family member(s).`
            : sosResult.notification_status === "FAILED" ? "SOS saved, but the family alert could not be saved." : "No authorized family alert recipients were found."}</div>}
          {sosResult && <div>{locationStatus}</div>}
          {sosResult?.maps_url && <div><a href={sosResult.maps_url} target="_blank" rel="noreferrer">Open reported coordinates in Maps</a></div>}
        </div>
        {contactTelHref && <a href={contactTelHref} className="btn-direct-tel-call"><FaPhone /> Call {contact.name || "emergency contact"} now</a>}
        {emergencyPhone && <a href={`tel:${emergencyPhone}`} className="btn-direct-tel-call"><FaPhone /> Call Emergency Services Now</a>}
        {!contactTelHref && !emergencyPhone && <p role="status">No callable emergency contact or local emergency number is configured. Use your phone’s emergency calling feature or call the emergency number for your area now.</p>}
        <p>Calls are placed by your device after you tap a call option. CareConnect does not automatically call emergency services.</p>
        {sosResult && !["CANCELLED", "RESOLVED"].includes(sosResult.status) && (
          <button type="button" className="btn-modal-cancel" onClick={async () => {
            if (!window.confirm("Cancel this emergency request? Use this only if it was activated by mistake.")) return;
            try {
              const result = await cancelSOS(sosResult.id);
              setSosResult((current) => ({ ...current, ...result }));
              onSosActivatedRef.current?.({ ...sosResult, ...result });
            } catch (err) { setCancelError(err.message || "Could not cancel the emergency request."); }
          }}>Cancel accidental SOS</button>
        )}
        <button type="button" className="btn-close-sos-status" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

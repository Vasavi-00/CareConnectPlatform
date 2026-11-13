import React from "react";
import useSafeBack from "../../hooks/useSafeBack";
import {
  FaArrowLeft,
  FaTriangleExclamation,
  FaPhone,
  FaUserShield,
  FaCheck,
} from "react-icons/fa6";

function getTelHref(phone) {
  const normalized = String(phone || "").replace(/[\s()-]/g, "");
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : "";
}

export default function ElderSOSPage({
  emergencyContacts = [],
  sosStatus,
  onOpenSosModal,
}) {
  const goBack = useSafeBack("/elder/dashboard");

  return (
    <div className="elder-subpage">
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={goBack}
        >
          <FaArrowLeft /> Back to Home
        </button>
        <div>
          <h1>Emergency Assistance</h1>
          <p>Instant help dispatch and priority emergency contacts</p>
        </div>
      </div>

      {/* Main Giant SOS Action Card */}
      <div className="elder-card elder-sos-command-card">
        <div className="sos-command-header">
          <div className="giant-sos-icon-ring">
            <FaTriangleExclamation />
          </div>
          <div>
            <h2>Immediate Emergency SOS</h2>
            <p>
              Tap the button below if you are feeling unwell, have had a fall, or
              need urgent medical assistance.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-giant-sos-trigger"
          onClick={onOpenSosModal}
        >
          🚨 ACTIVATE EMERGENCY HELP NOW
        </button>

        {sosStatus && (
          <div className="sos-page-status-alert">
            <div className="status-badge-title">
              <FaCheck /> {sosStatus.status === "CANCELLED" ? "Emergency Request Cancelled" : "Emergency Request Active"}
            </div>
            <p>{sosStatus.message || "Emergency request status is available."}</p>
            {getTelHref(sosStatus.contact?.phone) && (
              <a
                href={getTelHref(sosStatus.contact.phone)}
                className="btn-re-dial-contact"
              >
                <FaPhone /> Re-dial {sosStatus.contact.name} (
                {sosStatus.contact.phone})
              </a>
            )}
          </div>
        )}
      </div>

      {/* Priority Emergency Contacts */}
      <div className="elder-section-block">
        <h2 className="section-title-tag">Configured Emergency Contacts</h2>
        {emergencyContacts.length === 0 ? (
          <div className="elder-card elder-empty-box">
            <FaUserShield />
            <p>
              No phone contacts are configured. SOS can still notify family members
              who have an active CareConnect connection with SOS alerts enabled.
            </p>
          </div>
        ) : (
          <div className="emergency-contacts-grid">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id || contact.phone}
                className="elder-card emergency-contact-card"
              >
                <div className="contact-card-top">
                  <span className="priority-tag">
                    Priority #{contact.priority || 1}
                  </span>
                  <h3>{contact.name}</h3>
                  <span className="contact-relation">
                    {contact.relationship || "Emergency Contact"}
                  </span>
                </div>

                <div className="contact-card-phone-row">
                  <FaPhone /> <strong>{contact.phone}</strong>
                </div>

                <button
                  type="button"
                  className="btn-call-emergency-contact"
                  onClick={() => {
                    const href = getTelHref(contact.phone);
                    if (href) window.location.href = href;
                  }}
                  disabled={!getTelHref(contact.phone)}
                >
                  <FaPhone /> Call Now
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

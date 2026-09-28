import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTriangleExclamation,
  FaPhone,
  FaUserShield,
  FaCheck,
} from "react-icons/fa6";

export default function ElderSOSPage({
  emergencyContacts = [],
  sosStatus,
  onOpenSosModal,
}) {
  const navigate = useNavigate();

  return (
    <div className="elder-subpage">
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={() => navigate("/elder/dashboard")}
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
              <FaCheck /> Emergency Request Active
            </div>
            <p>{sosStatus.message || "Family members have been alerted."}</p>
            {sosStatus.contact && (
              <a
                href={`tel:${sosStatus.contact.phone}`}
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
              No specific emergency contacts found. Emergency alerts will notify all
              connected family members automatically.
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
                    if (contact.phone) {
                      window.location.href = `tel:${contact.phone}`;
                    }
                  }}
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

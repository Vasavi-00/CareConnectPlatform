import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaHeart,
  FaPhone,
  FaEnvelope,
  FaShieldHeart,
} from "react-icons/fa6";

export default function ElderFamilyPage({ familyMembers = [] }) {
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
          <h1>My Family & Caregivers</h1>
          <p>Loved ones who are connected with your CareConnect account</p>
        </div>
      </div>

      {familyMembers.length === 0 ? (
        <div className="elder-card elder-empty-full">
          <FaHeart className="empty-icon-lg" />
          <h2>No Family Members Connected Yet</h2>
          <p>
            Your family members can connect to your profile using your unique CareConnect ID.
          </p>
        </div>
      ) : (
        <div className="elder-family-grid">
          {familyMembers.map((member) => {
            const name = member.family_name || member.name || "Family Member";
            const initial = name.charAt(0).toUpperCase();
            const phone = member.family_phone || member.phone;

            return (
              <div key={member.id || member.email} className="elder-card elder-family-card">
                <div className="family-card-header">
                  <div className="family-avatar-large">{initial}</div>
                  <div>
                    <h2>{name}</h2>
                    <span className="relationship-pill">
                      {member.relationship_type || "Caregiver"}
                    </span>
                  </div>
                </div>

                <div className="family-card-details">
                  {phone && (
                    <div className="family-detail-row">
                      <FaPhone />
                      <span>{phone}</span>
                    </div>
                  )}
                  {member.family_email && (
                    <div className="family-detail-row">
                      <FaEnvelope />
                      <span>{member.family_email}</span>
                    </div>
                  )}
                  {member.is_primary_caregiver && (
                    <div className="primary-caregiver-badge">
                      <FaShieldHeart /> Primary Caregiver
                    </div>
                  )}
                </div>

                <div className="family-card-actions">
                  <button
                    type="button"
                    className="btn-call-family-large"
                    onClick={() => {
                      if (phone) {
                        window.location.href = `tel:${phone}`;
                      } else {
                        alert(`Phone number not configured for ${name}.`);
                      }
                    }}
                  >
                    <FaPhone /> Call {name}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import React from "react";
import {
  FaUserCircle,
  FaEnvelope,
  FaPhoneAlt,
  FaShieldAlt,
} from "react-icons/fa";

export default function ProfileSection({
  user,
  profile,
}) {
  const firstName =
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Rambabu";

  return (
    <section className="dashboard-content-section">
      <div className="section-page-header">
        <div>
          <span>ACCOUNT</span>
          <h2>My Profile</h2>
          <p>
            Your CareConnect family account.
          </p>
        </div>
      </div>

      <div className="profile-main-card">
        <div className="profile-large-avatar">
          {firstName[0].toUpperCase()}
        </div>

        <div>
          <span>FAMILY MEMBER</span>
          <h2>
            {user?.first_name ||
              user?.email?.split("@")[0] ||
              "Rambabu"}
          </h2>

          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-info-grid">
        <Info
          icon={<FaEnvelope />}
          label="Email"
          value={
            user?.email ||
            "Not available"
          }
        />

        <Info
          icon={<FaPhoneAlt />}
          label="Phone"
          value={
            user?.phone ||
            profile?.phone ||
            "Not available"
          }
        />

        <Info
          icon={<FaShieldAlt />}
          label="Account Role"
          value="Family Member"
        />

        <Info
          icon={<FaUserCircle />}
          label="CareConnect"
          value="Family Account"
        />
      </div>
    </section>
  );
}

function Info({
  icon,
  label,
  value,
}) {
  return (
    <div className="profile-info-card">
      <div className="profile-info-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
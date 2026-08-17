import React from "react";
import {
  FaPills,
  FaCalendarAlt,
  FaPhoneAlt,
  FaClock,
  FaArrowRight,
  FaExclamationTriangle,
} from "react-icons/fa";

export default function OverviewSection({
  medicines,
  appointments,
  contacts,
  onNavigate,
}) {
  const activeMedicines = medicines.filter(
    (medicine) => medicine.is_active !== false
  );

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status !== "CANCELLED"
    );

  const sosContacts = contacts.filter(
    (contact) =>
      contact.can_receive_sos &&
      contact.is_active !== false
  );

  return (
    <div className="overview-section">
      <div className="dashboard-stat-grid">
        <Stat
          icon={<FaPills />}
          title="Medicines"
          value={activeMedicines.length}
          label="Active medicines"
          tone="blue"
        />

        <Stat
          icon={<FaCalendarAlt />}
          title="Appointments"
          value={upcomingAppointments.length}
          label="Scheduled visits"
          tone="purple"
        />

        <Stat
          icon={<FaPhoneAlt />}
          title="Emergency"
          value={contacts.length}
          label="Trusted contacts"
          tone="orange"
        />

        <Stat
          icon={<FaPhoneAlt />}
          title="SOS"
          value={sosContacts.length}
          label="SOS recipients"
          tone="green"
        />
      </div>

      <div className="overview-panels">
        <div className="overview-panel">
          <div className="panel-title-row">
            <div>
              <span>MEDICATIONS</span>
              <h3>Today's medicines</h3>
            </div>

            <button
              onClick={() =>
                onNavigate("medicines")
              }
            >
              View all
              <FaArrowRight />
            </button>
          </div>

          {medicines.length === 0 ? (
            <EmptyState
              icon={<FaPills />}
              text="No medicines added yet."
            />
          ) : (
            <div className="overview-list">
              {medicines.slice(0, 4).map((medicine) => (
                <div
                  className="medicine-mini-row"
                  key={medicine.id}
                >
                  <div className="mini-icon blue">
                    <FaPills />
                  </div>

                  <div className="mini-content">
                    <strong>
                      {medicine.name}
                    </strong>

                    <span>
                      {medicine.dosage}
                    </span>
                  </div>

                  <div className="medicine-time">
                    <FaClock />

                    {Array.isArray(medicine.times)
                      ? medicine.times[0] || "—"
                      : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="overview-panel">
          <div className="panel-title-row">
            <div>
              <span>HEALTHCARE</span>
              <h3>Upcoming appointments</h3>
            </div>

            <button
              onClick={() =>
                onNavigate("appointments")
              }
            >
              View all
              <FaArrowRight />
            </button>
          </div>

          {appointments.length === 0 ? (
            <EmptyState
              icon={<FaCalendarAlt />}
              text="No appointments scheduled."
            />
          ) : (
            <div className="overview-list">
              {appointments
                .slice(0, 4)
                .map((appointment) => (
                  <div
                    className="appointment-mini-row"
                    key={appointment.id}
                  >
                    <div className="appointment-date-box">
                      <span>
                        {appointment.appointment_at
                          ? new Date(
                              appointment.appointment_at
                            ).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                              }
                            )
                          : "—"}
                      </span>

                      <strong>
                        {appointment.appointment_at
                          ? new Date(
                              appointment.appointment_at
                            ).getDate()
                          : "—"}
                      </strong>
                    </div>

                    <div className="mini-content">
                      <strong>
                        {appointment.doctor_name}
                      </strong>

                      <span>
                        {appointment.clinic_name}
                      </span>
                    </div>

                    <span className="appointment-status">
                      {appointment.status ||
                        "SCHEDULED"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="overview-panel emergency-overview-panel">
        <div className="panel-title-row">
          <div>
            <span>SAFETY</span>
            <h3>Emergency contacts</h3>
          </div>

          <button
            onClick={() =>
              onNavigate("emergency")
            }
          >
            Manage
            <FaArrowRight />
          </button>
        </div>

        {contacts.length === 0 ? (
          <EmptyState
            icon={<FaPhoneAlt />}
            text="No emergency contacts added."
          />
        ) : (
          <div className="contact-overview-grid">
            {contacts.slice(0, 4).map((contact) => (
              <div
                className="contact-overview-card"
                key={contact.id}
              >
                <div className="contact-overview-icon">
                  <FaPhoneAlt />
                </div>

                <div>
                  <strong>
                    {contact.name}
                  </strong>

                  <span>
                    {contact.relationship}
                  </span>
                </div>

                <div className="contact-priority">
                  P{contact.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="safety-notice">
        <div>
          <FaExclamationTriangle />
        </div>

        <div>
          <strong>
            CareConnect safety network
          </strong>

          <span>
            Keep emergency contacts up to date so
            SOS alerts reach the right people.
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  title,
  value,
  label,
  tone,
}) {
  return (
    <div className="dashboard-stat-card">
      <div className={`stat-icon ${tone}`}>
        {icon}
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="overview-empty">
      <div>{icon}</div>
      <span>{text}</span>
    </div>
  );
}
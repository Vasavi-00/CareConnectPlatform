import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaClock,
  FaLocationDot,
  FaNotesMedical,
  FaCheck,
} from "react-icons/fa6";

export default function ElderAppointmentsPage({ appointments = [] }) {
  const navigate = useNavigate();

  const now = new Date();

  const upcoming = appointments
    .filter((a) => a?.appointment_at && new Date(a.appointment_at) >= now)
    .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));

  const past = appointments
    .filter((a) => a?.appointment_at && new Date(a.appointment_at) < now)
    .sort((a, b) => new Date(b.appointment_at) - new Date(a.appointment_at));

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
          <h1>My Appointments</h1>
          <p>Upcoming and past medical visits arranged for you</p>
        </div>
      </div>

      <div className="elder-section-block">
        <h2 className="section-title-tag">Upcoming Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="elder-card elder-empty-box">
            <FaCalendarCheck />
            <p>No upcoming doctor appointments right now. Enjoy your day!</p>
          </div>
        ) : (
          <div className="elder-appointments-list">
            {upcoming.map((appt) => (
              <div key={appt.id} className="elder-card appointment-full-card">
                <div className="appt-card-left">
                  <div className="appt-badge-icon">
                    <FaCalendarCheck />
                  </div>
                  <div className="appt-main-info">
                    <h3>{appt.doctor_name}</h3>
                    <p className="appt-clinic">
                      <FaLocationDot /> {appt.clinic_name || "Healthcare Clinic"}
                    </p>
                    {appt.reason && (
                      <p className="appt-reason-line">
                        <FaNotesMedical /> <strong>Reason:</strong> {appt.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="appt-card-right">
                  <div className="appt-datetime-pill">
                    <span className="appt-date">
                      {new Date(appt.appointment_at).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="appt-time">
                      <FaClock />{" "}
                      {new Date(appt.appointment_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <span className="appt-status-tag">
                    {appt.status || "Confirmed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div className="elder-section-block past-section">
          <h2 className="section-title-tag past-tag">Past Visits</h2>
          <div className="elder-appointments-list">
            {past.map((appt) => (
              <div key={appt.id} className="elder-card appointment-full-card past">
                <div className="appt-card-left">
                  <div className="appt-badge-icon past">
                    <FaCheck />
                  </div>
                  <div className="appt-main-info">
                    <h3>{appt.doctor_name}</h3>
                    <p className="appt-clinic">
                      <FaLocationDot /> {appt.clinic_name || "Healthcare Clinic"}
                    </p>
                  </div>
                </div>

                <div className="appt-card-right">
                  <span className="appt-past-date">
                    {new Date(appt.appointment_at).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="appt-completed-tag">Completed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

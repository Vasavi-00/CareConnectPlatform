import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import {
  getConnectedElders,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../../services/api/familyApi";

import {
  FaCalendarPlus,
  FaCalendarCheck,
  FaUserDoctor,
  FaClock,
  FaLocationDot,
  FaPhone,
  FaVideo,
  FaPenToSquare,
  FaTrash,
  FaTriangleExclamation,
  FaCircleCheck,
  FaClockRotateLeft,
} from "react-icons/fa6";

import "../../styles/family/AppointmentsPage.css";

export default function AppointmentsPage() {
  const location = useLocation();

  // =========================================================
  // HASH SCROLL
  // =========================================================

  useEffect(() => {
    if (location.hash) {
      const section = document.getElementById(
        location.hash.substring(1)
      );

      if (section) {
        setTimeout(() => {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  }, [location.hash]);

  // =========================================================
  // ELDER STATE
  // =========================================================

  const [elders, setElders] = useState([]);
  const [selectedElderId, setSelectedElderId] = useState("");

  const [loadingElders, setLoadingElders] = useState(true);
  const [elderError, setElderError] = useState("");

  // =========================================================
  // APPOINTMENT STATE
  // =========================================================

  const [appointments, setAppointments] = useState([]);

  const [loadingAppointments, setLoadingAppointments] =
    useState(false);

  const [appointmentError, setAppointmentError] =
    useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);

  // =========================================================
  // FORM STATE
  // =========================================================

  const [formData, setFormData] = useState({
    doctor: "",
    appointmentType: "General Checkup",
    date: "",
    time: "",
    mode: "In-person",
    reason: "",
  });

  const [editingAppointmentId, setEditingAppointmentId] = useState(null);

  const [message, setMessage] = useState("");

  // =========================================================
  // LOAD CONNECTED ELDERS
  // =========================================================

  useEffect(() => {
    const loadElders = async () => {
      try {
        setLoadingElders(true);
        setElderError("");

        const data = await getConnectedElders();

        const connectedElders = Array.isArray(data)
          ? data
          : [];

        setElders(connectedElders);

        if (connectedElders.length > 0) {
          setSelectedElderId(
            String(connectedElders[0].elder)
          );
        }
      } catch (error) {
        console.error(
          "Failed to load connected elders:",
          error
        );

        setElderError(
          error.message ||
          "Unable to load connected elders."
        );
      } finally {
        setLoadingElders(false);
      }
    };

    loadElders();
  }, []);

  // =========================================================
  // LOAD APPOINTMENTS
  // =========================================================

  useEffect(() => {
    const loadAppointments = async () => {
      if (!selectedElderId) {
        setAppointments([]);
        return;
      }

      try {
        setLoadingAppointments(true);
        setAppointmentError("");

        const data = await getAppointments(
          selectedElderId
        );

        setAppointments(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Failed to load appointments:",
          error
        );

        setAppointmentError(
          error.message ||
          "Unable to load appointments."
        );
      } finally {
        setLoadingAppointments(false);
      }
    };

    loadAppointments();
  }, [selectedElderId]);

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // BOOK APPOINTMENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedElderId) {
      setMessage("Please select an elder first.");
      return;
    }

    if (!formData.doctor) {
      setMessage("Please select a doctor.");
      return;
    }

    if (!formData.date || !formData.time) {
      setMessage(
        "Please select appointment date and time."
      );
      return;
    }

    try {
      setMessage("");
      setAppointmentError("");

      const payload = {
        elder_id: Number(selectedElderId),
        doctor_name: formData.doctor,
        clinic_name: "CareConnect Clinic",
        appointment_at: `${formData.date}T${formData.time}:00`,
        reason: formData.reason,
        notes: formData.appointmentType,
        status: "SCHEDULED",
      };

      if (editingAppointmentId) {
        // Update existing appointment
        await updateAppointment(editingAppointmentId, payload);

        setMessage("Appointment updated successfully!");

        // Clear editing state
        setEditingAppointmentId(null);
      } else {
        // Create new appointment
        await createAppointment(payload);
        setMessage("Appointment booked successfully!");
      }

      // Reload appointments
      const updatedAppointments = await getAppointments(selectedElderId);
      setAppointments(Array.isArray(updatedAppointments) ? updatedAppointments : []);

      // Reset form
      setFormData({
        doctor: "",
        appointmentType: "General Checkup",
        date: "",
        time: "",
        mode: "In-person",
        reason: "",
      });

      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      console.error("Appointment save failed:", error);
      setAppointmentError(error.message || (editingAppointmentId ? "Failed to update appointment." : "Failed to book appointment."));
    }
  };

  // =========================================================
  // EDIT APPOINTMENT
  // =========================================================

  const handleEdit = (appointment) => {
    if (!appointment) return;

    // Prefill form with appointment values
    const dt = new Date(appointment.appointment_at);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toTimeString().slice(0, 5);

    setFormData({
      doctor: appointment.doctor_name || "",
      appointmentType: appointment.notes || "General Checkup",
      date,
      time,
      mode: appointment.mode || "In-person",
      reason: appointment.reason || "",
    });

    setEditingAppointmentId(appointment.id);

    // Scroll to booking form
    const el = document.getElementById("book");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingAppointmentId(null);
    setFormData({
      doctor: "",
      appointmentType: "General Checkup",
      date: "",
      time: "",
      mode: "In-person",
      reason: "",
    });
  };

  // =========================================================
  // DELETE APPOINTMENT
  // =========================================================

  const handleDelete = async (appointmentId) => {
    // Open modal to confirm deletion
    setAppointmentError("");
    setAppointmentToDelete(appointmentId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      setAppointmentError("");

      await deleteAppointment(appointmentToDelete);

      const updatedAppointments = await getAppointments(selectedElderId);
      setAppointments(Array.isArray(updatedAppointments) ? updatedAppointments : []);

      setMessage("Appointment cancelled successfully.");
      setTimeout(() => setMessage(""), 4000);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error("Failed to delete appointment:", error);
      setAppointmentError(error.message || "Failed to cancel appointment.");
    }
  };

  const cancelDelete = () => {
    setAppointmentError("");
    setShowDeleteModal(false);
    setAppointmentToDelete(null);
  };

  // =========================================================
  // VIEW DETAILS + MARK COMPLETED
  // =========================================================

  const viewDetails = (appointment) => {
    setAppointmentDetails(appointment);
    setShowDetailsModal(true);
  };

  const markCompleted = async () => {
    if (!appointmentDetails) return;

    try {
      setAppointmentError("");

      const payload = {
        elder_id: appointmentDetails.elder?.id || appointmentDetails.elder_id,
        doctor_name: appointmentDetails.doctor_name,
        clinic_name: appointmentDetails.clinic_name || "CareConnect Clinic",
        appointment_at: appointmentDetails.appointment_at,
        reason: appointmentDetails.reason,
        notes: appointmentDetails.notes,
        status: "COMPLETED",
      };

      await updateAppointment(appointmentDetails.id, payload);

      const updatedAppointments = await getAppointments(selectedElderId);
      setAppointments(Array.isArray(updatedAppointments) ? updatedAppointments : []);

      setMessage("Appointment marked as completed.");
      setTimeout(() => setMessage(""), 4000);

      setShowDetailsModal(false);
      setAppointmentDetails(null);
    } catch (err) {
      console.error("Failed to mark completed:", err);
      setAppointmentError(err.message || "Failed to update appointment.");
    }
  };

  // =========================================================
  // SELECTED ELDER
  // =========================================================

  const selectedElder = elders.find(
    (elder) =>
      String(elder.elder) ===
      String(selectedElderId)
  );

  // =========================================================
  // APPOINTMENT FILTERING
  // =========================================================

  const now = new Date();

  const upcomingAppointments =
    appointments.filter((appointment) => {
      const appointmentDate =
        new Date(appointment.appointment_at);

      return (
        appointmentDate >= now &&
        appointment.status !== "CANCELLED"
      );
    });

  const pastAppointments =
    appointments.filter((appointment) => {
      const appointmentDate =
        new Date(appointment.appointment_at);

      return (
        appointmentDate < now ||
        appointment.status === "COMPLETED"
      );
    });

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const getDay = (dateString) => {
    return new Date(dateString)
      .getDate()
      .toString()
      .padStart(2, "0");
  };

  const getMonth = (dateString) => {
    return new Date(dateString)
      .toLocaleString("en-US", {
        month: "short",
      })
      .toUpperCase();
  };

  const getTime = (dateString) => {
    return new Date(
      dateString
    ).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getFullDate = (dateString) => {
    return new Date(
      dateString
    ).toLocaleString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section className="appointments-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <section className="appointments-hero">

        <div className="appointments-hero-left">

          <div className="appointments-hero-icon">
            <FaCalendarCheck />
          </div>

          <div>
            <h1>Appointments</h1>

            <p>
              Manage and schedule your parent's
              medical appointments.
            </p>
          </div>

        </div>

        <div className="appointments-hero-right">
          <span>
            “Stay on top of every appointment
          </span>

          <span>
            for better care and peace of mind.”
          </span>
        </div>

      </section>

      {/* =================================================
          BOOK APPOINTMENT + QUICK INFO
      ================================================= */}

      <div className="appointment-top-grid">

        {/* ===============================================
            BOOK APPOINTMENT
        =============================================== */}

        <div
          className="book-appointment-card"
          id="book"
        >

          <div className="section-heading">

            <div className="section-heading-icon blue">
              <FaCalendarPlus />
            </div>

            <div>

              <h2>
                Book an Appointment
              </h2>

              <p>
                Schedule a visit for your parent
              </p>

            </div>

          </div>

          {/* Elder loading error */}

          {elderError && (
            <div className="appointment-error">
              {elderError}
            </div>
          )}

          <form
            className="appointment-form"
            onSubmit={handleSubmit}
          >

            {/* =========================================
                ELDER
            ========================================= */}

            <div className="form-group">

              <label htmlFor="elder">
                Select Elder
              </label>

              <select
                id="elder"
                value={selectedElderId}
                onChange={(event) =>
                  setSelectedElderId(
                    event.target.value
                  )
                }
                disabled={
                  loadingElders ||
                  elders.length === 0
                }
              >

                {loadingElders ? (
                  <option value="">
                    Loading elders...
                  </option>
                ) : elders.length === 0 ? (
                  <option value="">
                    No connected elders
                  </option>
                ) : (
                  elders.map((elder) => (
                    <option
                      key={elder.elder}
                      value={elder.elder}
                    >
                      {elder.elder_name ||
                        elder.elder_email ||
                        elder.careconnect_id}
                    </option>
                  ))
                )}

              </select>

            </div>

            {/* =========================================
                DOCTOR
            ========================================= */}

            <div className="form-group">

              <label htmlFor="doctor">
                Doctor / Specialist
              </label>

              <select
                id="doctor"
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select a doctor
                </option>

                <option value="Dr. Mehta">
                  Dr. Mehta — Physician
                </option>

                <option value="Dr. Ramesh">
                  Dr. Ramesh — Ophthalmologist
                </option>

                <option value="Dr. Sara">
                  Dr. Sara — Dentist
                </option>

                <option value="Dr. Rao">
                  Dr. Rao — General Physician
                </option>

              </select>

            </div>

            {/* =========================================
                APPOINTMENT TYPE
            ========================================= */}

            <div className="form-group">

              <label htmlFor="appointmentType">
                Appointment Type
              </label>

              <select
                id="appointmentType"
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleChange}
              >

                <option value="General Checkup">
                  General Checkup
                </option>

                <option value="Eye Checkup">
                  Eye Checkup
                </option>

                <option value="Dental Checkup">
                  Dental Checkup
                </option>

                <option value="Medicine Review">
                  Medicine Review
                </option>

                <option value="Follow-up Visit">
                  Follow-up Visit
                </option>

              </select>

            </div>

            {/* =========================================
                DATE
            ========================================= */}

            <div className="form-group">

              <label htmlFor="date">
                Preferred Date
              </label>

              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />

            </div>

            {/* =========================================
                TIME
            ========================================= */}

            <div className="form-group">

              <label htmlFor="time">
                Preferred Time
              </label>

              <input
                id="time"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />

            </div>

            {/* =========================================
                MODE
            ========================================= */}

            <div className="form-group">

              <label>
                Consultation Mode
              </label>

              <div className="mode-options">

                <label
                  className={`mode-option ${
                    formData.mode === "In-person"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="mode"
                    value="In-person"
                    checked={
                      formData.mode ===
                      "In-person"
                    }
                    onChange={handleChange}
                  />

                  <FaLocationDot />

                  <span>
                    In-person
                  </span>

                </label>

                <label
                  className={`mode-option ${
                    formData.mode === "Video"
                      ? "selected"
                      : ""
                  }`}
                >

                  <input
                    type="radio"
                    name="mode"
                    value="Video"
                    checked={
                      formData.mode === "Video"
                    }
                    onChange={handleChange}
                  />

                  <FaVideo />

                  <span>
                    Video Call
                  </span>

                </label>

              </div>

            </div>

            {/* =========================================
                REASON
            ========================================= */}

            <div className="form-group full-width">

              <label htmlFor="reason">
                Reason / Notes
              </label>

              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Add any symptoms, concerns, or notes..."
                rows="3"
              />

            </div>

            {/* =========================================
                SUCCESS
            ========================================= */}

            {message && (
              <div className="appointment-success">

                <FaCircleCheck />

                {message}

              </div>
            )}

            {/* =========================================
                ERROR
            ========================================= */}

            {appointmentError && (
              <div className="appointment-error">

                {appointmentError}

              </div>
            )}

            {/* =========================================
                SUBMIT
            ========================================= */}

            <button
              type="submit"
              className="book-button"
              disabled={
                loadingElders ||
                elders.length === 0 ||
                loadingAppointments
              }
            >

              <FaCalendarPlus />

              {editingAppointmentId ? "Save Changes" : "Book Appointment"}

            </button>

            {editingAppointmentId && (
              <button
                type="button"
                className="cancel-edit-button"
                onClick={cancelEdit}
              >
                Cancel Edit
              </button>
            )}

          </form>

        </div>

        {/* ===============================================
            APPOINTMENT INFORMATION
        =============================================== */}

        <div className="appointment-info-card">

          <div className="info-card-heading">

            <div className="info-icon">
              <FaUserDoctor />
            </div>

            <div>

              <h3>
                Need help choosing a doctor?
              </h3>

              <p>
                Select a specialist based on
                your parent's care needs.
              </p>

            </div>

          </div>

          <div className="specialist-item">

            <div className="specialist-icon">
              <FaUserDoctor />
            </div>

            <div>

              <strong>
                General Physician
              </strong>

              <span>
                Routine checkups & health concerns
              </span>

            </div>

          </div>

          <div className="specialist-item">

            <div className="specialist-icon">
              <FaUserDoctor />
            </div>

            <div>

              <strong>
                Ophthalmologist
              </strong>

              <span>
                Eye checkups & vision care
              </span>

            </div>

          </div>

          <div className="specialist-item">

            <div className="specialist-icon">
              <FaUserDoctor />
            </div>

            <div>

              <strong>
                Dentist
              </strong>

              <span>
                Dental care & oral health
              </span>

            </div>

          </div>

          <div className="appointment-help">

            <FaPhone />

            <div>

              <strong>
                Need assistance?
              </strong>

              <span>
                Contact your care team for
                help with appointments.
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* =================================================
          UPCOMING APPOINTMENTS
      ================================================= */}

      <section
        className="appointments-section"
        id="upcoming"
      >

        <div className="appointments-section-header">

          <div>

            <h2>
              <FaCalendarCheck />

              Upcoming Appointments
            </h2>

            <p>
              Your parent's scheduled visits
            </p>

          </div>

          <span className="appointment-count">

            {upcomingAppointments.length}
            {" "}
            upcoming

          </span>

        </div>

        <div className="appointment-list">

          {loadingAppointments ? (

            <div className="appointment-empty">
              Loading appointments...
            </div>

          ) : upcomingAppointments.length === 0 ? (

            <div className="appointment-empty">
              No upcoming appointments.
            </div>

          ) : (

            upcomingAppointments.map(
              (appointment) => (

                <div
                  className="appointment-card"
                  key={appointment.id}
                >

                  <div className="appointment-date">

                    <strong>
                      {getDay(
                        appointment.appointment_at
                      )}
                    </strong>

                    <span>
                      {getMonth(
                        appointment.appointment_at
                      )}
                    </span>

                  </div>

                  <div className="appointment-details">

                    <h3>
                      {appointment.reason ||
                        "Medical Appointment"}
                    </h3>

                    <p>
                      <FaUserDoctor />

                      {appointment.doctor_name}
                    </p>

                    <p>
                      <FaClock />

                      {getTime(
                        appointment.appointment_at
                      )}
                    </p>

                  </div>

                  <div className="appointment-status upcoming">

                    {appointment.status}

                  </div>

                  <div className="appointment-actions">

                    <button
                      type="button"
                      title="Edit appointment"
                      onClick={() => handleEdit(appointment)}
                    >
                      <FaPenToSquare />
                    </button>

                    <button
                      type="button"
                      title="View details"
                      onClick={() => viewDetails(appointment)}
                    >
                      <FaCircleCheck />
                    </button>

                    <button
                      type="button"
                      title="Cancel appointment"
                      className="delete"
                      onClick={() => handleDelete(appointment.id)}
                    >
                      <FaTrash />
                    </button>

                  </div>

                </div>

              )
            )

          )}

        </div>

      </section>

      {/* =================================================
          PAST APPOINTMENTS
      ================================================= */}

      <section
        className="appointments-section past-section"
      >

        <div className="appointments-section-header">

          <div>

            <h2>
              <FaClockRotateLeft />

              Past Appointments
            </h2>

            <p>
              Recently completed appointments
            </p>

          </div>

          <button
            type="button"
            className="view-history-button"
          >
            View History
          </button>

        </div>

        <div className="past-appointments-grid">

          {pastAppointments.length === 0 ? (

            <div className="appointment-empty">
              No past appointments.
            </div>

          ) : (

            pastAppointments.map(
              (appointment) => (

                <div
                  className="past-appointment-card"
                  key={appointment.id}
                >

                  <div className="past-icon">
                    <FaCircleCheck />
                  </div>

                  <div>

                    <h3>
                      {appointment.reason ||
                        "Medical Appointment"}
                    </h3>

                    <p>
                      {appointment.doctor_name}
                    </p>

                    <span>
                      {getFullDate(
                        appointment.appointment_at
                      )}
                    </span>

                  </div>

                  <span className="completed-badge">

                    {appointment.status ===
                    "COMPLETED"
                      ? "Completed"
                      : "Past"}

                  </span>

                </div>

              )
            )

          )}

        </div>

      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="small-confirm-modal-backdrop" onClick={cancelDelete}>
          <div className="small-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="small-confirm-icon">
              <FaTriangleExclamation />
            </div>
            <h3>Cancel appointment?</h3>
            <p>Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            {appointmentError && <div className="appointment-error">{appointmentError}</div>}
            <div className="small-confirm-actions">
              <button type="button" className="small-confirm-secondary" onClick={cancelDelete}>Keep</button>
              <button type="button" className="small-confirm-danger" onClick={confirmDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && appointmentDetails && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Appointment details</h3>
            <p><strong>Doctor:</strong> {appointmentDetails.doctor_name}</p>
            <p><strong>When:</strong> {getFullDate(appointmentDetails.appointment_at)}</p>
            <p><strong>Reason:</strong> {appointmentDetails.reason}</p>
            <p><strong>Notes:</strong> {appointmentDetails.notes}</p>
            <p><strong>Status:</strong> {appointmentDetails.status}</p>
            {appointmentError && <div className="appointment-error">{appointmentError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => { setShowDetailsModal(false); setAppointmentDetails(null); }}>Close</button>
              {appointmentDetails.status !== "COMPLETED" && (
                <button type="button" className="btn-primary" onClick={markCompleted}>Mark completed</button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
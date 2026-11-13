import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useFocusTrap from "../../hooks/useFocusTrap";

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
  FaPenToSquare,
  FaTrash,
  FaTriangleExclamation,
  FaCircleCheck,
  FaClockRotateLeft,
} from "react-icons/fa6";

import "../../styles/family/AppointmentsPage.css";

const getLocalDateInputValue = (date = new Date()) => {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

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
    clinic: "",
    date: "",
    time: "",
    reason: "",
    location: "",
    notes: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

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
          ? data.filter((relationship) => relationship.can_manage_appointments)
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
    setFieldErrors((previous) => ({ ...previous, [name]: "" }));
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

    const errors = {};
    if (!formData.doctor.trim()) errors.doctor = "Enter the doctor's name.";
    if (!formData.clinic.trim()) errors.clinic = "Enter a hospital or clinic name.";
    if (!formData.date) errors.date = "Choose an appointment date.";
    if (!formData.time) errors.time = "Choose an appointment time.";
    if (!formData.location.trim()) errors.location = "Enter the appointment address.";

    const appointmentDate = new Date(
      `${formData.date}T${formData.time}:00`
    );

    if (formData.date && formData.time && (Number.isNaN(appointmentDate.getTime()) || appointmentDate <= new Date())) {
      errors.date = "Choose a future date and time.";
      errors.time = "Choose a future date and time.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setMessage("");
      setAppointmentError("");

      const payload = {
        elder_id: Number(selectedElderId),
        doctor_name: formData.doctor.trim(),
        clinic_name: formData.clinic.trim(),
        appointment_at: appointmentDate.toISOString(),
        location: formData.location.trim(),
        reason: formData.reason.trim(),
        notes: formData.notes.trim(),
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
        clinic: "",
        date: "",
        time: "",
        reason: "",
        location: "",
        notes: "",
      });
      setFieldErrors({});

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
    const date = getLocalDateInputValue(dt);
    const time = dt.toTimeString().slice(0, 5);

    setFormData({
      doctor: appointment.doctor_name || "",
      clinic: appointment.clinic_name || "",
      date,
      time,
      reason: appointment.reason || "",
      location: appointment.location || "",
      notes: appointment.notes || "",
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
      clinic: "",
      date: "",
      time: "",
      reason: "",
      location: "",
      notes: "",
    });
    setFieldErrors({});
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

  const closeDetails = () => {
    setShowDetailsModal(false);
    setAppointmentDetails(null);
  };

  // =========================================================
  // VIEW DETAILS + MARK COMPLETED
  // =========================================================

  const viewDetails = (appointment) => {
    setAppointmentDetails(appointment);
    setShowDetailsModal(true);
  };

  const deleteDialogRef = useFocusTrap(showDeleteModal, cancelDelete);
  const detailsDialogRef = useFocusTrap(showDetailsModal, closeDetails);

  const markCompleted = async () => {
    if (!appointmentDetails) return;

    try {
      setAppointmentError("");

      await updateAppointment(appointmentDetails.id, { status: "COMPLETED" });

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
  // APPOINTMENT FILTERING
  // =========================================================

  const now = new Date();

  const upcomingAppointments =
    appointments.filter((appointment) => {
      const appointmentDate =
        new Date(appointment.appointment_at);

      return (
        appointmentDate >= now &&
        !["CANCELLED", "CANCELED", "COMPLETED"].includes(appointment.status)
      );
    });

  const pastAppointments =
    appointments.filter((appointment) => {
      const appointmentDate =
        new Date(appointment.appointment_at);

      return (
        appointmentDate < now ||
        ["CANCELLED", "CANCELED", "COMPLETED"].includes(appointment.status)
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

              <input
                id="doctor"
                type="text"
                name="doctor"
                value={formData.doctor}
                onChange={handleChange}
                maxLength={150}
                placeholder="Enter doctor's full name"
                required
                aria-invalid={Boolean(fieldErrors.doctor)}
                aria-describedby={fieldErrors.doctor ? "doctor-error" : undefined}
              />
              {fieldErrors.doctor && <small className="appointment-field-error" id="doctor-error">{fieldErrors.doctor}</small>}

            </div>

            <div className="form-group">
              <label htmlFor="clinic">Hospital / Clinic Name</label>
              <input id="clinic" type="text" name="clinic" value={formData.clinic} onChange={handleChange} maxLength={200} placeholder="Enter hospital or clinic name" required aria-invalid={Boolean(fieldErrors.clinic)} aria-describedby={fieldErrors.clinic ? "clinic-error" : undefined} />
              {fieldErrors.clinic && <small className="appointment-field-error" id="clinic-error">{fieldErrors.clinic}</small>}
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
                min={getLocalDateInputValue()}
                onChange={handleChange}
                required
                aria-invalid={Boolean(fieldErrors.date)}
                aria-describedby={fieldErrors.date ? "date-error" : undefined}
              />
              {fieldErrors.date && <small className="appointment-field-error" id="date-error">{fieldErrors.date}</small>}

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
                aria-invalid={Boolean(fieldErrors.time)}
                aria-describedby={fieldErrors.time ? "time-error" : undefined}
              />
              {fieldErrors.time && <small className="appointment-field-error" id="time-error">{fieldErrors.time}</small>}

            </div>
            <div className="form-group full-width">
              <label htmlFor="location">Appointment Location / Full Address</label>
              <textarea id="location" name="location" value={formData.location} onChange={handleChange} maxLength={1000} placeholder="Enter the complete hospital or clinic address" rows="3" required aria-invalid={Boolean(fieldErrors.location)} aria-describedby={fieldErrors.location ? "location-error" : undefined} />
              {fieldErrors.location && <small className="appointment-field-error" id="location-error">{fieldErrors.location}</small>}
            </div>

            {/* =========================================
                REASON
            ========================================= */}

            <div className="form-group full-width">

              <label htmlFor="reason">Reason for Appointment (optional)</label>

              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                placeholder="For example, routine check-up or consultation"
                rows="3"
              />

            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Additional Notes (optional)</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Add anything else the family or elder should know" rows="3" />
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
                    <p><FaLocationDot /> {appointment.clinic_name}{appointment.location ? ` - ${appointment.location}` : ""}</p>

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
                    <p>{appointment.clinic_name}{appointment.location ? ` - ${appointment.location}` : ""}</p>

                    <span>
                      {getFullDate(
                        appointment.appointment_at
                      )}
                    </span>

                  </div>

                  <span className="completed-badge">

                    {appointment.status === "COMPLETED" ? "Completed" : ["CANCELLED", "CANCELED"].includes(appointment.status) ? "Cancelled" : "Past"}

                  </span>

                </div>

              )
            )

          )}

        </div>

      </section>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="small-confirm-modal-backdrop" role="presentation" onClick={cancelDelete}>
          <div ref={deleteDialogRef} className="small-confirm-modal-card" role="alertdialog" aria-modal="true" aria-label="Cancel appointment confirmation" onClick={(e) => e.stopPropagation()}>
            <div className="small-confirm-icon">
              <FaTriangleExclamation />
            </div>
            <h3>Cancel appointment?</h3>
            <p>This marks the appointment as cancelled and keeps it in the appointment history.</p>
            {appointmentError && <div className="appointment-error">{appointmentError}</div>}
            <div className="small-confirm-actions">
              <button type="button" className="small-confirm-secondary" onClick={cancelDelete}>Keep</button>
              <button type="button" className="small-confirm-danger" onClick={confirmDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && appointmentDetails && (
        <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
          <div ref={detailsDialogRef} className="modal-card" role="dialog" aria-modal="true" aria-label="Appointment details">
            <h3>Appointment details</h3>
            <p><strong>Doctor:</strong> {appointmentDetails.doctor_name}</p>
            <p><strong>Hospital / clinic:</strong> {appointmentDetails.clinic_name}</p>
            <p><strong>When:</strong> {getFullDate(appointmentDetails.appointment_at)}</p>
            <p><strong>Address:</strong> {appointmentDetails.location || "Not provided"}</p>
            {appointmentDetails.reason && <p><strong>Reason:</strong> {appointmentDetails.reason}</p>}
            {appointmentDetails.notes && <p><strong>Notes:</strong> {appointmentDetails.notes}</p>}
            <p><strong>Status:</strong> {appointmentDetails.status}</p>
            {appointmentError && <div className="appointment-error">{appointmentError}</div>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={closeDetails}>Close</button>
              {!['COMPLETED', 'CANCELLED', 'CANCELED'].includes(appointmentDetails.status) && (
                <button type="button" className="btn-primary" onClick={markCompleted}>Mark completed</button>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

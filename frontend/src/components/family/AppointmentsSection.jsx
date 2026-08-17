import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaMapMarkerAlt,
} from "react-icons/fa";

export default function AppointmentsSection({
  appointments,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const emptyForm = {
    doctor_name: "",
    clinic_name: "",
    appointment_at: "",
    reason: "",
    notes: "",
    status: "SCHEDULED",
  };

  const [showForm, setShowForm] =
    useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const openAdd = () => {
    setEditingAppointment(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (
    appointment
  ) => {
    setEditingAppointment(appointment);

    setForm({
      doctor_name:
        appointment.doctor_name || "",
      clinic_name:
        appointment.clinic_name || "",
      appointment_at:
        appointment.appointment_at
          ? appointment.appointment_at.slice(
              0,
              16
            )
          : "",
      reason:
        appointment.reason || "",
      notes:
        appointment.notes || "",
      status:
        appointment.status ||
        "SCHEDULED",
    });

    setShowForm(true);
  };

  const updateField = (
    field,
    value
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      appointment_at: form.appointment_at
        ? new Date(
            form.appointment_at
          ).toISOString()
        : "",
    };

    if (editingAppointment) {
      await onUpdate(
        editingAppointment.id,
        payload
      );
    } else {
      await onCreate(payload);
    }

    setShowForm(false);
  };

  return (
    <section className="dashboard-content-section">
      <div className="section-page-header">
        <div>
          <span>HEALTHCARE MANAGEMENT</span>
          <h2>Appointments</h2>
          <p>
            Keep upcoming medical visits organized.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={openAdd}
        >
          <FaPlus />
          Add Appointment
        </button>
      </div>

      {loading ? (
        <LoadingBlock text="Loading appointments..." />
      ) : appointments.length === 0 ? (
        <EmptySection
          icon={<FaCalendarAlt />}
          title="No appointments yet"
          text="Add an upcoming medical appointment."
          buttonText="Add Appointment"
          onClick={openAdd}
        />
      ) : (
        <div className="appointment-card-list">
          {appointments.map(
            (appointment) => {
              const date = appointment.appointment_at
                ? new Date(
                    appointment.appointment_at
                  )
                : null;

              return (
                <div
                  className="appointment-full-card"
                  key={appointment.id}
                >
                  <div className="appointment-big-date">
                    <span>
                      {date?.toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                        }
                      ) || "—"}
                    </span>

                    <strong>
                      {date?.getDate() ||
                        "—"}
                    </strong>
                  </div>

                  <div className="appointment-main">
                    <div className="appointment-title-row">
                      <h3>
                        {appointment.doctor_name}
                      </h3>

                      <span className="appointment-status-badge">
                        {appointment.status ||
                          "SCHEDULED"}
                      </span>
                    </div>

                    <p>
                      {appointment.reason ||
                        "Medical appointment"}
                    </p>

                    <div className="appointment-details-line">
                      <span>
                        <FaCalendarAlt />
                        {date
                          ? date.toLocaleTimeString(
                              "en-US",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )
                          : "Time unavailable"}
                      </span>

                      <span>
                        <FaMapMarkerAlt />
                        {appointment.clinic_name ||
                          "Clinic not specified"}
                      </span>
                    </div>

                    {appointment.notes && (
                      <div className="appointment-notes">
                        {appointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      onClick={() =>
                        openEdit(
                          appointment
                        )
                      }
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="danger"
                      onClick={() =>
                        onDelete(
                          appointment.id
                        )
                      }
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {showForm && (
        <Modal
          title={
            editingAppointment
              ? "Edit Appointment"
              : "Add Appointment"
          }
          onClose={() =>
            setShowForm(false)
          }
        >
          <form
            className="family-form"
            onSubmit={submit}
          >
            <div className="form-two-columns">
              <Field label="Doctor Name">
                <input
                  value={
                    form.doctor_name
                  }
                  onChange={(e) =>
                    updateField(
                      "doctor_name",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="Clinic / Hospital">
                <input
                  value={
                    form.clinic_name
                  }
                  onChange={(e) =>
                    updateField(
                      "clinic_name",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="Appointment Date & Time">
                <input
                  type="datetime-local"
                  value={
                    form.appointment_at
                  }
                  onChange={(e) =>
                    updateField(
                      "appointment_at",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="Status">
                <select
                  value={
                    form.status
                  }
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value
                    )
                  }
                >
                  <option value="SCHEDULED">
                    Scheduled
                  </option>
                  <option value="CONFIRMED">
                    Confirmed
                  </option>
                  <option value="COMPLETED">
                    Completed
                  </option>
                  <option value="CANCELLED">
                    Cancelled
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Reason">
              <input
                value={form.reason}
                onChange={(e) =>
                  updateField(
                    "reason",
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Notes">
              <textarea
                rows="4"
                value={form.notes}
                onChange={(e) =>
                  updateField(
                    "notes",
                    e.target.value
                  )
                }
              />
            </Field>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-action"
              >
                {editingAppointment
                  ? "Save Changes"
                  : "Add Appointment"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Modal({
  title,
  children,
  onClose,
}) {
  return (
    <div
      className="family-modal-overlay"
      onMouseDown={onClose}
    >
      <div
        className="family-modal"
        onMouseDown={(e) =>
          e.stopPropagation()
        }
      >
        <div className="family-modal-header">
          <h3>{title}</h3>

          <button
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function LoadingBlock({ text }) {
  return (
    <div className="section-loading">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}

function EmptySection({
  icon,
  title,
  text,
  buttonText,
  onClick,
}) {
  return (
    <div className="empty-section">
      <div className="empty-section-icon">
        {icon}
      </div>

      <h3>{title}</h3>
      <p>{text}</p>

      <button
        className="primary-action"
        onClick={onClick}
      >
        <FaPlus />
        {buttonText}
      </button>
    </div>
  );
}
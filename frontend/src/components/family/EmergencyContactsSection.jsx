import React, { useState } from "react";
import {
  FaPhoneAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";

export default function EmergencyContactsSection({
  contacts,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const emptyForm = {
    name: "",
    phone: "",
    relationship: "",
    priority: 1,
    can_receive_sos: true,
    is_active: true,
  };

  const [showForm, setShowForm] =
    useState(false);

  const [editingContact, setEditingContact] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const openAdd = () => {
    setEditingContact(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (
    contact
  ) => {
    setEditingContact(contact);

    setForm({
      name: contact.name || "",
      phone: contact.phone || "",
      relationship:
        contact.relationship || "",
      priority:
        contact.priority || 1,
      can_receive_sos:
        contact.can_receive_sos !== false,
      is_active:
        contact.is_active !== false,
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
      priority: Number(
        form.priority
      ),
    };

    if (editingContact) {
      await onUpdate(
        editingContact.id,
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
          <span>SAFETY MANAGEMENT</span>
          <h2>Emergency Contacts</h2>
          <p>
            People who can help your elder during
            an emergency.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={openAdd}
        >
          <FaPlus />
          Add Contact
        </button>
      </div>

      {loading ? (
        <LoadingBlock text="Loading emergency contacts..." />
      ) : contacts.length === 0 ? (
        <EmptySection
          icon={<FaPhoneAlt />}
          title="No emergency contacts"
          text="Add trusted people to your elder's safety network."
          buttonText="Add Contact"
          onClick={openAdd}
        />
      ) : (
        <div className="contact-card-list">
          {contacts.map(
            (contact) => (
              <div
                className="contact-full-card"
                key={contact.id}
              >
                <div className="contact-big-icon">
                  <FaPhoneAlt />
                </div>

                <div className="contact-main">
                  <div className="contact-title-row">
                    <h3>
                      {contact.name}
                    </h3>

                    {contact.is_active !==
                      false && (
                      <span className="status-active">
                        <FaCheckCircle />
                        Active
                      </span>
                    )}
                  </div>

                  <p>
                    {contact.relationship}
                  </p>

                  <strong className="contact-phone">
                    {contact.phone}
                  </strong>

                  <div className="contact-badges">
                    <span>
                      Priority{" "}
                      {contact.priority}
                    </span>

                    {contact.can_receive_sos && (
                      <span className="sos-badge">
                        SOS enabled
                      </span>
                    )}
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    onClick={() =>
                      openEdit(
                        contact
                      )
                    }
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      onDelete(
                        contact.id
                      )
                    }
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {showForm && (
        <Modal
          title={
            editingContact
              ? "Edit Emergency Contact"
              : "Add Emergency Contact"
          }
          onClose={() =>
            setShowForm(false)
          }
        >
          <form
            className="family-form"
            onSubmit={submit}
          >
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) =>
                  updateField(
                    "name",
                    e.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Phone Number">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                required
              />
            </Field>

            <Field label="Relationship">
              <input
                value={
                  form.relationship
                }
                onChange={(e) =>
                  updateField(
                    "relationship",
                    e.target.value
                  )
                }
                placeholder="Son, Daughter, Neighbor..."
                required
              />
            </Field>

            <Field label="Priority">
              <select
                value={
                  form.priority
                }
                onChange={(e) =>
                  updateField(
                    "priority",
                    e.target.value
                  )
                }
              >
                <option value="1">
                  Priority 1
                </option>

                <option value="2">
                  Priority 2
                </option>

                <option value="3">
                  Priority 3
                </option>
              </select>
            </Field>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={
                  form.can_receive_sos
                }
                onChange={(e) =>
                  updateField(
                    "can_receive_sos",
                    e.target.checked
                  )
                }
              />

              <span>
                Can receive SOS alerts
              </span>
            </label>

            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={
                  form.is_active
                }
                onChange={(e) =>
                  updateField(
                    "is_active",
                    e.target.checked
                  )
                }
              />

              <span>
                Contact is active
              </span>
            </label>

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
                {editingContact
                  ? "Save Changes"
                  : "Add Contact"}
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
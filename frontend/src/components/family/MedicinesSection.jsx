import React, { useMemo, useState } from "react";
import {
  FaPills,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

export default function MedicinesSection({
  medicines,
  loading,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const initialForm = {
    name: "",
    dosage: "",
    frequency: "ONCE_DAILY",
    purchase_date: "",
    start_date: "",
    end_date: "",
    low_stock_threshold: 5,
    is_active: true,
    doses_per_day: 1,
    food_timing: "ANY",
    notes: "",
    quantity: 1,
    times: ["08:00"],
  };

  const [showForm, setShowForm] =
    useState(false);

  const [editingMedicine, setEditingMedicine] =
    useState(null);

  const [form, setForm] =
    useState(initialForm);

  const sortedMedicines = useMemo(
    () =>
      [...medicines].sort((a, b) =>
        String(a.name).localeCompare(
          String(b.name)
        )
      ),
    [medicines]
  );

  const openAdd = () => {
    setEditingMedicine(null);

    setForm({
      ...initialForm,
      start_date: new Date()
        .toISOString()
        .slice(0, 10),
    });

    setShowForm(true);
  };

  const openEdit = (medicine) => {
    setEditingMedicine(medicine);

    setForm({
      name: medicine.name || "",
      dosage: medicine.dosage || "",
      frequency:
        medicine.frequency || "ONCE_DAILY",
      purchase_date:
        medicine.purchase_date || "",
      start_date:
        medicine.start_date || "",
      end_date:
        medicine.end_date || "",
      low_stock_threshold:
        medicine.low_stock_threshold ?? 5,
      is_active:
        medicine.is_active !== false,
      doses_per_day:
        medicine.doses_per_day || 1,
      food_timing:
        medicine.food_timing || "ANY",
      notes: medicine.notes || "",
      quantity:
        medicine.quantity ?? 1,
      times:
        Array.isArray(medicine.times) &&
        medicine.times.length
          ? medicine.times
          : ["08:00"],
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

  const updateTime = (
    index,
    value
  ) => {
    setForm((previous) => {
      const times = [...previous.times];
      times[index] = value;

      return {
        ...previous,
        times,
      };
    });
  };

  const addTime = () => {
    setForm((previous) => ({
      ...previous,
      times: [
        ...previous.times,
        "",
      ],
    }));
  };

  const removeTime = (index) => {
    setForm((previous) => ({
      ...previous,
      times: previous.times.filter(
        (_, itemIndex) =>
          itemIndex !== index
      ),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      quantity: Number(form.quantity),
      low_stock_threshold:
        Number(form.low_stock_threshold),
      doses_per_day:
        Number(form.doses_per_day),
      times: form.times.filter(Boolean),
    };

    if (editingMedicine) {
      await onUpdate(
        editingMedicine.id,
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
          <span>MEDICATION MANAGEMENT</span>
          <h2>Medicines</h2>
          <p>
            Manage medication schedules and
            stock for the selected elder.
          </p>
        </div>

        <button
          className="primary-action"
          onClick={openAdd}
        >
          <FaPlus />
          Add Medicine
        </button>
      </div>

      {loading ? (
        <LoadingBlock text="Loading medicines..." />
      ) : medicines.length === 0 ? (
        <EmptySection
          icon={<FaPills />}
          title="No medicines yet"
          text="Add the first medicine for this elder."
          buttonText="Add Medicine"
          onClick={openAdd}
        />
      ) : (
        <div className="medicine-card-list">
          {sortedMedicines.map(
            (medicine) => (
              <div
                className="medicine-full-card"
                key={medicine.id}
              >
                <div className="medicine-card-icon">
                  <FaPills />
                </div>

                <div className="medicine-card-main">
                  <div className="medicine-card-title">
                    <h3>
                      {medicine.name}
                    </h3>

                    <span
                      className={
                        medicine.is_active
                          ? "status-active"
                          : "status-inactive"
                      }
                    >
                      {medicine.is_active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <p>
                    {medicine.dosage}
                  </p>

                  <div className="medicine-meta-grid">
                    <Meta
                      label="Frequency"
                      value={
                        medicine.frequency
                      }
                    />

                    <Meta
                      label="Quantity"
                      value={
                        medicine.quantity
                      }
                    />

                    <Meta
                      label="Doses/day"
                      value={
                        medicine.doses_per_day
                      }
                    />

                    <Meta
                      label="Food timing"
                      value={
                        medicine.food_timing
                      }
                    />
                  </div>

                  {Array.isArray(
                    medicine.times
                  ) &&
                    medicine.times.length >
                      0 && (
                      <div className="medicine-times">
                        {medicine.times.map(
                          (time) => (
                            <span
                              key={time}
                            >
                              {time}
                            </span>
                          )
                        )}
                      </div>
                    )}

                  {medicine.notes && (
                    <p className="medicine-notes">
                      {medicine.notes}
                    </p>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    onClick={() =>
                      openEdit(
                        medicine
                      )
                    }
                    title="Edit"
                  >
                    <FaEdit />
                  </button>

                  <button
                    className="danger"
                    onClick={() =>
                      onDelete(
                        medicine.id
                      )
                    }
                    title="Delete"
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
            editingMedicine
              ? "Edit Medicine"
              : "Add Medicine"
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
              <Field
                label="Medicine Name"
              >
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

              <Field label="Dosage">
                <input
                  value={form.dosage}
                  onChange={(e) =>
                    updateField(
                      "dosage",
                      e.target.value
                    )
                  }
                  placeholder="500 mg"
                  required
                />
              </Field>

              <Field label="Frequency">
                <select
                  value={
                    form.frequency
                  }
                  onChange={(e) =>
                    updateField(
                      "frequency",
                      e.target.value
                    )
                  }
                >
                  <option value="ONCE_DAILY">
                    Once daily
                  </option>
                  <option value="TWICE_DAILY">
                    Twice daily
                  </option>
                  <option value="THREE_TIMES_DAILY">
                    Three times daily
                  </option>
                  <option value="AS_NEEDED">
                    As needed
                  </option>
                </select>
              </Field>

              <Field label="Quantity">
                <input
                  type="number"
                  min="0"
                  value={
                    form.quantity
                  }
                  onChange={(e) =>
                    updateField(
                      "quantity",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="Purchase Date">
                <input
                  type="date"
                  value={
                    form.purchase_date
                  }
                  onChange={(e) =>
                    updateField(
                      "purchase_date",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Start Date">
                <input
                  type="date"
                  value={
                    form.start_date
                  }
                  onChange={(e) =>
                    updateField(
                      "start_date",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="End Date">
                <input
                  type="date"
                  value={
                    form.end_date
                  }
                  onChange={(e) =>
                    updateField(
                      "end_date",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Low Stock Alert">
                <input
                  type="number"
                  min="0"
                  value={
                    form.low_stock_threshold
                  }
                  onChange={(e) =>
                    updateField(
                      "low_stock_threshold",
                      e.target.value
                    )
                  }
                />
              </Field>

              <Field label="Doses Per Day">
                <input
                  type="number"
                  min="1"
                  value={
                    form.doses_per_day
                  }
                  onChange={(e) =>
                    updateField(
                      "doses_per_day",
                      e.target.value
                    )
                  }
                  required
                />
              </Field>

              <Field label="Food Timing">
                <select
                  value={
                    form.food_timing
                  }
                  onChange={(e) =>
                    updateField(
                      "food_timing",
                      e.target.value
                    )
                  }
                >
                  <option value="ANY">
                    Any time
                  </option>
                  <option value="BEFORE">
                    Before food
                  </option>
                  <option value="AFTER">
                    After food
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Medicine Times">
              <div className="time-editor">
                {form.times.map(
                  (time, index) => (
                    <div
                      className="time-row"
                      key={index}
                    >
                      <input
                        type="time"
                        value={time}
                        onChange={(e) =>
                          updateTime(
                            index,
                            e.target.value
                          )
                        }
                      />

                      {form.times.length >
                        1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeTime(
                              index
                            )
                          }
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                  )
                )}

                <button
                  type="button"
                  className="text-action"
                  onClick={addTime}
                >
                  + Add another time
                </button>
              </div>
            </Field>

            <Field label="Notes">
              <textarea
                rows="3"
                value={form.notes}
                onChange={(e) =>
                  updateField(
                    "notes",
                    e.target.value
                  )
                }
              />
            </Field>

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
                Medicine is active
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
                {editingMedicine
                  ? "Save Changes"
                  : "Add Medicine"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
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
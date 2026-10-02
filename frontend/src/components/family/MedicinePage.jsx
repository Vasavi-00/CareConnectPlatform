import React, { useEffect, useState } from "react";
import {
  FaPills,
  FaCalendarCheck,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaPlus,
  FaBell,
  FaRotate,
  FaChartSimple,
  FaPenToSquare,
  FaTrash,
  FaMagnifyingGlass,
  FaSun,
  FaCloudSun,
  FaMoon,
  FaCheck,
  FaCircle,
  FaXmark,
} from "react-icons/fa6";

import { createMedicine, deleteMedicine as removeMedicine, getMedicines, updateMedicine } from "../../services/api/familyApi";
import "../../styles/family/MedicinePage.css";

export default function MedicinePage({ selectedElder }) {
  const canManageMedicines = selectedElder?.can_manage_medicines !== false;
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("All");

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [medicineToDelete, setMedicineToDelete] = useState(null);
  const [showDeleteMedicineModal, setShowDeleteMedicineModal] = useState(false);

  useEffect(() => {
    let active = true;
    const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
    if (!elderId) {
      setMedicines([]);
      return undefined;
    }
    setLoading(true);
    setError("");
    getMedicines(elderId)
      .then((rows) => { if (active) setMedicines(rows.map((item) => ({
        ...item,
        stock: Number(item.quantity || 0),
        unit: "units",
        schedule: [item.frequency, item.timing].filter(Boolean).join(" · ") || "As prescribed",
        status: Number(item.quantity || 0) <= Number(item.low_stock_threshold || 5) ? "Low Stock" : "Good",
      }))); })
      .catch((err) => { if (active) setError(err.message || "Unable to load medicines."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedElder]);

  const createIntakeSlot = () => ({ timing: "Morning", time: "08:00" });

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    timing: "Morning",
    time: "08:00",
    foodTiming: "After Food",
    stock: "",
    lowStockThreshold: "5",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    prescribedBy: "",
    notes: "",
    unit: "tablets",
  });

  const [intakeSlots, setIntakeSlots] = useState([createIntakeSlot()]);

  const normalizeScheduleValue = (value) => {
    if (!value) return null;

    const text = String(value).toLowerCase();
    const keywordMatch = text.match(/(morning|afternoon|noon|evening|night)/i);
    if (keywordMatch) {
      const keyword = keywordMatch[1].toLowerCase();
      if (keyword.includes("morning")) return { period: "morning", hour: 8 };
      if (keyword.includes("afternoon") || keyword.includes("noon")) return { period: "afternoon", hour: 13 };
      return { period: "night", hour: 20 };
    }

    const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!timeMatch) return null;

    let hour = Number(timeMatch[1]);
    const suffix = (timeMatch[3] || "").toLowerCase();
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;

    const period = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : "night";
    return { period, hour };
  };

  const getMedicineTimeValue = (medicine) => {
    const rawValues = [
      medicine.timing,
      ...(Array.isArray(medicine.times) ? medicine.times : []),
      medicine.frequency,
    ].filter(Boolean);

    const parsed = rawValues
      .map((value) => normalizeScheduleValue(value))
      .filter(Boolean)
      .sort((a, b) => a.hour - b.hour);

    if (parsed.length === 0) return 24 * 60;

    return parsed[0].hour * 60;
  };

  const today = new Date().toISOString().slice(0, 10);
  const todayMedicines = [...medicines]
    .filter((medicine) =>
      medicine.is_active !== false
      && (!medicine.start_date || medicine.start_date <= today)
      && (!medicine.end_date || medicine.end_date >= today)
    )
    .sort((a, b) => getMedicineTimeValue(a) - getMedicineTimeValue(b));

  const dosesFor = (period) => todayMedicines.filter((medicine) => {
    const values = [medicine.timing, ...(Array.isArray(medicine.times) ? medicine.times : [])].filter(Boolean);
    if (values.length === 0) return false;

    return values.some((value) => {
      const parsed = normalizeScheduleValue(value);
      if (!parsed) return false;
      return parsed.period === period;
    });
  });

  const filteredMedicines = medicines.filter((medicine) => {
  const matchesSearch = medicine.name
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  const matchesStock =
    stockFilter === "All" ||
    medicine.status === stockFilter;

  return matchesSearch && matchesStock;
});

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewMedicine((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleIntakeSlotChange = (index, field, value) => {
    setIntakeSlots((prev) => prev.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, [field]: value } : slot
    )));
  };

  const addIntakeSlot = () => {
    setIntakeSlots((prev) => [...prev, createIntakeSlot()]);
  };

  const parseIntakeSlotsFromMedicine = (medicine) => {
    if (!medicine) return [createIntakeSlot()];

    const rawEntries = [];

    if (Array.isArray(medicine.times) && medicine.times.length) {
      rawEntries.push(...medicine.times);
    } else if (medicine.timing) {
      rawEntries.push(...String(medicine.timing).split(";").map((value) => value.trim()).filter(Boolean));
    }

    if (!rawEntries.length) {
      return [createIntakeSlot()];
    }

    return rawEntries.map((entry) => {
      const text = String(entry).trim();
      const timeMatch = text.match(/(\d{1,2}:\d{2})/);
      const timingMatch = text.match(/(Morning|Afternoon|Evening|Night)/i);

      return {
        timing: timingMatch ? timingMatch[1] : "Morning",
        time: timeMatch ? timeMatch[1] : "08:00",
      };
    });
  };

  const openMedicineForm = (medicine = null) => {
    setError("");
    setEditingMedicine(medicine ? medicine.id : null);
    setNewMedicine({
      name: medicine?.name || "",
      dosage: medicine?.dosage || "",
      frequency: medicine?.frequency || "Once daily",
      timing: medicine?.timing || "Morning",
      time: medicine?.times?.[0]?.match(/\d{1,2}:\d{2}/)?.[0] || "08:00",
      foodTiming: medicine?.food_timing || medicine?.foodTiming || "After Food",
      stock: medicine?.quantity ?? medicine?.stock ?? "",
      lowStockThreshold: medicine?.low_stock_threshold ?? medicine?.lowStockThreshold ?? "5",
      startDate: medicine?.start_date || new Date().toISOString().slice(0, 10),
      endDate: medicine?.end_date || "",
      prescribedBy: medicine?.prescribed_by || "",
      notes: medicine?.notes || "",
      unit: medicine?.unit || "tablets",
    });
    setIntakeSlots(parseIntakeSlotsFromMedicine(medicine));
    setShowAddMedicine(true);
  };

  const closeMedicineForm = () => {
    setShowAddMedicine(false);
    setEditingMedicine(null);
    setError("");
    setNewMedicine({
      name: "",
      dosage: "",
      frequency: "Once daily",
      timing: "Morning",
      time: "08:00",
      foodTiming: "After Food",
      stock: "",
      lowStockThreshold: "5",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      prescribedBy: "",
      notes: "",
      unit: "tablets",
    });
    setIntakeSlots([createIntakeSlot()]);
  };

  const removeIntakeSlot = (index) => {
    setIntakeSlots((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, slotIndex) => slotIndex !== index);
    });
  };

  const handleAddMedicine = async (e) => {
    if (e) e.preventDefault();

    const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
    if (!elderId) {
      setError("Please select an elder before adding a medicine.");
      return;
    }

    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.frequency || !newMedicine.stock || !newMedicine.startDate || !newMedicine.foodTiming) {
      setError("Name, dosage, frequency, stock, start date and food timing are required.");
      return;
    }

    const validSlots = intakeSlots.filter((slot) => slot.time && slot.time.trim());
    if (!validSlots.length) {
      setError("Please add at least one medicine time.");
      return;
    }

    try {
      setError("");

      const intakeEntries = validSlots.map((slot) => `${slot.timing} at ${slot.time}`);

      const payload = {
        elder_id: elderId,
        name: newMedicine.name.trim(),
        dosage: newMedicine.dosage.trim(),
        frequency: newMedicine.frequency,
        timing: intakeEntries.join("; "),
        times: intakeEntries,
        start_date: newMedicine.startDate,
        end_date: newMedicine.endDate || null,
        food_timing: newMedicine.foodTiming,
        prescribed_by: newMedicine.prescribedBy.trim(),
        notes: newMedicine.notes.trim(),
        quantity: Number(newMedicine.stock) || 0,
        low_stock_threshold: Number(newMedicine.lowStockThreshold) || 5,
        refill_threshold: Number(newMedicine.lowStockThreshold) || 5,
        is_active: true,
      };

      if (editingMedicine) {
        await updateMedicine(editingMedicine, payload);
      } else {
        await createMedicine(payload);
      }

      const refreshed = await getMedicines(elderId);
      setMedicines(refreshed.map((item) => ({
        ...item,
        stock: Number(item.quantity || 0),
        unit: "units",
        schedule: [item.frequency, item.timing].filter(Boolean).join(" · ") || "As prescribed",
        status: Number(item.quantity || 0) <= Number(item.low_stock_threshold || 5) ? "Low Stock" : "Good",
      })));

      closeMedicineForm();
    } catch (err) { setError(err.message || "Unable to add medicine."); }
  };

  const deleteMedicine = async () => {
    if (!medicineToDelete) return;

    try {
      setError("");
      await removeMedicine(medicineToDelete.id);
      setMedicines((prev) => prev.filter((medicine) => medicine.id !== medicineToDelete.id));
      setShowDeleteMedicineModal(false);
      setMedicineToDelete(null);
    } catch (err) { setError(err.message || "Unable to delete medicine."); }
  };

  useEffect(() => {
  const scrollToSection = () => {
    const hash = window.location.hash;

    if (!hash) return;

    const element = document.querySelector(hash);

    if (element) {
      setTimeout(() => {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  };

  scrollToSection();
}, []);

  return (
    <div className="medicine-page">

      {/* =====================================
          PAGE HEADING BANNER
      ===================================== */}

      <section className="medicine-hero">

        <div className="medicine-hero-left">

          <div className="medicine-hero-icon">
            <FaPills />
          </div>

          <div>
            <h1>Medicines</h1>

            <p>
              Manage your parent's medicines, schedule and stock.
            </p>
          </div>

        </div>

        <div className="medicine-hero-right">

          <span>
            “Right medicine at the right time
          </span>

          <span>
            for a healthier tomorrow.”
          </span>

        </div>

      </section>


      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <section className="medicine-summary-grid">

        <div className="medicine-summary-card green-card">

          <div className="summary-icon">
            <FaPills />
          </div>

          <div>
            <span>Total Medicines</span>
            <strong>{medicines.length}</strong>
            <small>{todayMedicines.length} active today</small>
          </div>

        </div>


        <div className="medicine-summary-card blue-card">

          <div className="summary-icon">
            <FaCalendarCheck />
          </div>

          <div>
            <span>Medicines Today</span>
            <strong>{todayMedicines.length}</strong>
            <small>{todayMedicines.length} active today</small>
          </div>

        </div>


        <div className="medicine-summary-card orange-card">

          <div className="summary-icon">
            <FaTriangleExclamation />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>
              {medicines.filter((medicine) => medicine.status === "Low Stock").length}
            </strong>
            <small>need refill soon</small>
          </div>

        </div>


        <div className="medicine-summary-card red-card">

          <div className="summary-icon">
            <FaCircleExclamation />
          </div>

          <div>
            <span>Missed Doses</span>
            <strong>—</strong>
            <small>dose tracking unavailable</small>
          </div>

        </div>

      </section>


      {/* =====================================
          MAIN MEDICINE CONTENT
      ===================================== */}

      <section id="today" className="medicine-main-grid">


        {/* TODAY'S MEDICINES */}

        <div className="today-medicines-card">

          <div className="section-heading">

            <div>
              <h2>
                <FaCalendarCheck />
                Today's Medicines
              </h2>

              <p>
                {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <button type="button" className="view-schedule-btn" onClick={() => document.querySelector("#stock")?.scrollIntoView({ behavior: "smooth" })}>
              View Inventory →
            </button>

          </div>


          {/* MORNING */}

          <div className="medicine-time-group morning-group">

            <div className="time-label">
              <FaSun />
              <strong>Morning ({dosesFor("morning").length})</strong>
            </div>

            <div className="dose-list">

              {dosesFor("morning").map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.id}
                >

                  <span className="dose-status pending"><FaCircle /></span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dosage} • {medicine.timing || medicine.frequency || "Time not set"}
                  </span>

                  <span className="dose-badge pending-badge">Scheduled</span>

                </div>
              ))}

            </div>

          </div>


          {/* AFTERNOON */}

          <div className="medicine-time-group afternoon-group">

            <div className="time-label">
              <FaCloudSun />
              <strong>Afternoon ({dosesFor("afternoon").length})</strong>
            </div>

            <div className="dose-list">

              {dosesFor("afternoon").map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.id}
                >

                  <span className="dose-status pending">
                    <FaCircle />
                  </span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dosage} • {medicine.timing || medicine.frequency || "Time not set"}
                  </span>

                  <span className="dose-badge pending-badge">
                    Scheduled
                  </span>

                </div>
              ))}

            </div>

          </div>


          {/* NIGHT */}

          <div className="medicine-time-group night-group">

            <div className="time-label">
              <FaMoon />
              <strong>Evening / night ({dosesFor("night").length})</strong>
            </div>

            <div className="dose-list">

              {dosesFor("night").map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.id}
                >

                  <span className="dose-status pending">
                    <FaCircle />
                  </span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dosage} • {medicine.timing || medicine.frequency || "Time not set"}
                  </span>

                  <span className="dose-badge pending-badge">
                    Scheduled
                  </span>

                </div>
              ))}

            </div>

          </div>

        </div>


        {/* RIGHT SIDE */}

        <div className="medicine-side-column">


          {/* QUICK ACTIONS */}

          <div className="medicine-actions-card">

            <h2>
              <FaPlus />
              Quick Actions
            </h2>

            <div className="medicine-action-grid">

              {canManageMedicines && <button
                type="button"
                onClick={() => {
                  setEditingMedicine(null);
                  setNewMedicine({
                    name: "",
                    dosage: "",
                    frequency: "Once daily",
                    timing: "Morning",
                    time: "08:00",
                    foodTiming: "After Food",
                    stock: "",
                    lowStockThreshold: "5",
                    startDate: new Date().toISOString().slice(0, 10),
                    endDate: "",
                    prescribedBy: "",
                    notes: "",
                    unit: "tablets",
                    times: [{ period: "Morning", time: "08:00" }],
                  });
                  setShowAddMedicine(true);
                }}
                className="action-item add-action"
              >
                <FaPlus />
                <span>Add Medicine</span>
              </button>}

              <button type="button" className="action-item reminder-action" onClick={() => document.querySelector("#today")?.scrollIntoView({ behavior: "smooth" })}>
                <FaBell />
                <span>View Schedule</span>
              </button>

              <button type="button" className="action-item refill-action" onClick={() => { setStockFilter("Low Stock"); document.querySelector("#stock")?.scrollIntoView({ behavior: "smooth" }); }}>
                <FaRotate />
                <span>Review Refills</span>
              </button>

              <button type="button" className="action-item report-action" onClick={() => document.querySelector("#stock")?.scrollIntoView({ behavior: "smooth" })}>
                <FaChartSimple />
                <span>View Stock</span>
              </button>

            </div>

          </div>


          {/* REFILL REMINDERS */}

          <div className="refill-card">

            <div className="section-heading">

              <h2>
                <FaBell />
                Refill Reminders
              </h2>

              <button type="button" onClick={() => { setStockFilter("Low Stock"); document.querySelector("#stock")?.scrollIntoView({ behavior: "smooth" }); }}>
                View Low Stock →
              </button>

            </div>


            {medicines.filter((medicine) => medicine.status === "Low Stock").length ? medicines.filter((medicine) => medicine.status === "Low Stock").map((medicine) => (
              <div className="refill-item" key={medicine.id}>
                <div className="refill-icon"><FaPills /></div>
                <div className="refill-info"><strong>{medicine.name}</strong><span>Low stock · {medicine.stock} units left</span></div>
              </div>
            )) : <p>No medicines currently need a refill.</p>}

          </div>

        </div>

      </section>


      {/* =====================================
          MEDICINE STOCK
      ===================================== */}

      <section className="medicine-stock-card" id="stock">

        <div className="stock-header">

          <div>
            <h2>
              <FaPills />
              Medicine Stock
            </h2>

            <p>
              Monitor your parent's current medicine inventory.
            </p>
          </div>

          <div className="stock-controls">

            <div className="medicine-search">

              <FaMagnifyingGlass />

              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
              />

            </div>

            <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            >
              <option>All</option>
              <option>Good</option>
              <option>Low Stock</option>
            </select>

          </div>

        </div>


        <div className="medicine-table-wrapper">

          <table className="medicine-table">

            <thead>
              <tr>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Schedule</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading && <tr><td colSpan="6">Loading medicines…</td></tr>}
              {error && <tr><td colSpan="6" role="alert">{error}</td></tr>}
              {!loading && !error && !filteredMedicines.length && <tr><td colSpan="6">No medicines found for this elder.</td></tr>}
              {filteredMedicines.map((medicine) => (

                <tr key={medicine.id}>

                  <td>
                    <div className="medicine-name">

                      <span className="table-pill">
                        <FaPills />
                      </span>

                      <strong>
                        {medicine.name}
                      </strong>

                    </div>
                  </td>

                  <td>{medicine.dosage}</td>

                  <td>{medicine.schedule}</td>

                  <td>
                    {medicine.stock} {medicine.unit}
                  </td>

                  <td>

                    <span
                      className={`stock-status ${
                        medicine.status === "Good"
                          ? "good-status"
                          : "low-status"
                      }`}
                    >
                      <FaCircle />
                      {medicine.status}
                    </span>

                  </td>

                  <td>

                    <div className="table-actions">

                      {canManageMedicines && <>
                        <button title="Edit" type="button" onClick={() => openMedicineForm(medicine)}>
                          <FaPenToSquare />
                        </button>
                        <button title="Delete" type="button" onClick={() => { setMedicineToDelete(medicine); setShowDeleteMedicineModal(true); }}><FaTrash /></button>
                      </>}

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </section>


      {/* =====================================
          ADD MEDICINE MODAL
      ===================================== */}

      {showDeleteMedicineModal && medicineToDelete && (
        <div className="small-confirm-modal-backdrop" onClick={() => { setShowDeleteMedicineModal(false); setMedicineToDelete(null); }}>
          <div className="small-confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="small-confirm-icon">
              <FaTriangleExclamation />
            </div>
            <h3>Delete medicine?</h3>
            <p>Delete <strong>{medicineToDelete.name}</strong>? This action cannot be undone.</p>
            <div className="small-confirm-actions">
              <button type="button" className="small-confirm-secondary" onClick={() => { setShowDeleteMedicineModal(false); setMedicineToDelete(null); }}>Keep</button>
              <button type="button" className="small-confirm-danger" onClick={deleteMedicine}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {canManageMedicines && showAddMedicine && (

        <div
          className="medicine-modal-overlay"
          onClick={closeMedicineForm}
        >

          <div
            className="medicine-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">

              <div>
                <h2>
                  <FaPills />
                  {editingMedicine ? "Edit Medicine" : "Add Medicine"}
                </h2>

                <p>
                  Add a new medicine to the schedule.
                </p>
              </div>

              <button
                onClick={closeMedicineForm}
              >
                <FaXmark />
              </button>

            </div>


            <form onSubmit={handleAddMedicine}>

              <div className="form-group">

                <label>
                  Medicine Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Amlodipine"
                  value={newMedicine.name}
                  onChange={handleInputChange}
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    Dosage
                  </label>

                  <input
                    type="text"
                    name="dosage"
                    placeholder="e.g. 5 mg"
                    value={newMedicine.dosage}
                    onChange={handleInputChange}
                    required
                  />

                </div>


                <div className="form-group">

                  <label>
                    Stock (required)
                  </label>

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    placeholder="e.g. 30"
                    value={newMedicine.stock}
                    onChange={handleInputChange}
                    required
                  />

                </div>

              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Frequency
                  </label>
                  <select
                    name="frequency"
                    value={newMedicine.frequency}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Once daily">Once daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Thrice daily">Thrice daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="As needed">As needed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Food Timing
                  </label>
                  <select
                    name="foodTiming"
                    value={newMedicine.foodTiming}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Before Food">Before Food</option>
                    <option value="After Food">After Food</option>
                    <option value="With Food">With Food</option>
                    <option value="Any time">Any time</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group intake-times-field">
                  <div className="intake-time-header">
                    <label>
                      Intake Time
                    </label>

                    <button type="button" className="inline-add-time-link" onClick={addIntakeSlot}>
                      Add another time
                    </button>
                  </div>

                  <div className="intake-time-list">
                    {intakeSlots.map((slot, index) => (
                      <div key={`slot-${index}`} className="intake-time-input-row">
                        <select
                          value={slot.timing}
                          onChange={(e) => handleIntakeSlotChange(index, "timing", e.target.value)}
                        >
                          <option value="Morning">Morning</option>
                          <option value="Afternoon">Afternoon</option>
                          <option value="Evening">Evening</option>
                          <option value="Night">Night</option>
                        </select>

                        <input
                          type="time"
                          value={slot.time}
                          onChange={(e) => handleIntakeSlotChange(index, "time", e.target.value)}
                          required
                        />

                        {intakeSlots.length > 1 && (
                          <button
                            type="button"
                            className="remove-time-btn"
                            onClick={() => removeIntakeSlot(index)}
                            aria-label="Remove intake time"
                            title="Remove this time"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={newMedicine.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={newMedicine.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Refill Alert at
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    min="0"
                    value={newMedicine.lowStockThreshold}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Prescribed By
                  </label>
                  <input
                    type="text"
                    name="prescribedBy"
                    placeholder="Doctor / Hospital"
                    value={newMedicine.prescribedBy}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Notes
                </label>
                <textarea
                  name="notes"
                  rows="3"
                  placeholder="Any extra instructions"
                  value={newMedicine.notes}
                  onChange={handleInputChange}
                />
              </div>

              {error && (
                <div className="medicine-form-error" role="alert">
                  {error}
                </div>
              )}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeMedicineForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-medicine-btn"
                  onClick={() => {
                    setError("");
                  }}
                >
                  <FaPlus />
                  {editingMedicine ? "Save Medicine" : "Add Medicine"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
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

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dosage: "",
    schedule: "",
    stock: "",
    unit: "tablets",
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayMedicines = medicines.filter((medicine) =>
    medicine.is_active !== false
    && (!medicine.start_date || medicine.start_date <= today)
    && (!medicine.end_date || medicine.end_date >= today)
  );
  const dosesFor = (period) => todayMedicines.filter((medicine) => {
    const schedule = [medicine.timing, ...(Array.isArray(medicine.times) ? medicine.times : [])]
      .filter(Boolean).join(" ").toLowerCase();
    if (/morning/.test(schedule)) return period === "morning";
    if (/afternoon|noon/.test(schedule)) return period === "afternoon";
    if (/evening|night/.test(schedule)) return period === "night";
    const time = schedule.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
    if (!time) return false;
    let hour = Number(time[1]);
    if (time[3] === "pm" && hour < 12) hour += 12;
    if (time[3] === "am" && hour === 12) hour = 0;
    const bucket = hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : "night";
    return bucket === period;
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

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
    if (!elderId || !newMedicine.name || !newMedicine.dosage) return;
    try {
      setError("");
      const payload = {
        elder_id: elderId,
        name: newMedicine.name,
        dosage: newMedicine.dosage,
        frequency: newMedicine.schedule || "Once daily",
        timing: "",
        quantity: Number(newMedicine.stock) || 0,
        low_stock_threshold: 5,
        is_active: true,
      };
      const created = editingMedicine
        ? await updateMedicine(editingMedicine, payload)
        : await createMedicine(payload);
      const updatedMedicine = {
        ...created,
        stock: Number(created.quantity || 0),
        unit: "units",
        schedule: [created.frequency, created.timing].filter(Boolean).join(" · ") || "As prescribed",
        status: Number(created.quantity || 0) <= Number(created.low_stock_threshold || 5) ? "Low Stock" : "Good",
      };
      setMedicines((prev) => editingMedicine
        ? prev.map((item) => item.id === editingMedicine ? updatedMedicine : item)
        : [...prev, updatedMedicine]);
      setNewMedicine({ name: "", dosage: "", schedule: "", stock: "", unit: "tablets" });
      setEditingMedicine(null);
      setShowAddMedicine(false);
    } catch (err) { setError(err.message || "Unable to add medicine."); }
  };

  const deleteMedicine = async (id) => {
    try {
      await removeMedicine(id);
      setMedicines((prev) => prev.filter((medicine) => medicine.id !== id));
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
                onClick={() => { setEditingMedicine(null); setNewMedicine({ name: "", dosage: "", schedule: "", stock: "", unit: "tablets" }); setShowAddMedicine(true); }}
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
                        <button title="Edit" type="button" onClick={() => { setEditingMedicine(medicine.id); setNewMedicine({ name: medicine.name, dosage: medicine.dosage, schedule: medicine.frequency || medicine.schedule, stock: medicine.stock, unit: "tablets" }); setShowAddMedicine(true); }}>
                          <FaPenToSquare />
                        </button>
                        <button title="Delete" type="button" onClick={() => deleteMedicine(medicine.id)}><FaTrash /></button>
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

      {canManageMedicines && showAddMedicine && (

        <div
          className="medicine-modal-overlay"
          onClick={() => setShowAddMedicine(false)}
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
                onClick={() => setShowAddMedicine(false)}
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
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    placeholder="e.g. 30"
                    value={newMedicine.stock}
                    onChange={handleInputChange}
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-group">

                  <label>
                    Schedule
                  </label>

                  <input
                    type="text"
                    name="schedule"
                    placeholder="e.g. 1 tablet daily at 8:00 AM"
                    value={newMedicine.schedule}
                    onChange={handleInputChange}
                  />

                </div>




              </div>


              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowAddMedicine(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-medicine-btn"
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
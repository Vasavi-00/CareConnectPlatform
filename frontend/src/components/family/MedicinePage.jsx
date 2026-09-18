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

import "../../styles/family/MedicinePage.css";

export default function MedicinePage() {
  const [showAddMedicine, setShowAddMedicine] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("All");

  const [medicines, setMedicines] = useState([
    {
      id: 1,
      name: "Amlodipine",
      dosage: "5 mg",
      schedule: "1 tablet daily (8:00 AM)",
      stock: 45,
      unit: "tablets",
      status: "Good",
    },
    {
      id: 2,
      name: "Metformin",
      dosage: "500 mg",
      schedule: "1 tablet twice daily",
      stock: 8,
      unit: "tablets",
      status: "Low Stock",
    },
    {
      id: 3,
      name: "Vitamin D3",
      dosage: "1000 IU",
      schedule: "1 capsule daily (1:00 PM)",
      stock: 5,
      unit: "capsules",
      status: "Low Stock",
    },
    {
      id: 4,
      name: "Calcium",
      dosage: "600 mg",
      schedule: "1 tablet daily (1:30 PM)",
      stock: 28,
      unit: "tablets",
      status: "Good",
    },
    {
      id: 5,
      name: "Atorvastatin",
      dosage: "10 mg",
      schedule: "1 tablet daily (8:00 PM)",
      stock: 20,
      unit: "tablets",
      status: "Good",
    },
    {
      id: 6,
      name: "Omeprazole",
      dosage: "20 mg",
      schedule: "1 capsule daily (9:00 PM)",
      stock: 12,
      unit: "capsules",
      status: "Low Stock",
    },
  ]);

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    dosage: "",
    schedule: "",
    stock: "",
    unit: "tablets",
  });

  const todayMedicines = {
    morning: [
      {
        name: "Amlodipine 5mg",
        dose: "1 tablet",
        time: "8:00 AM",
        taken: true,
      },
      {
        name: "Metformin 500mg",
        dose: "1 tablet",
        time: "8:30 AM",
        taken: true,
      },
    ],

    afternoon: [
      {
        name: "Vitamin D3",
        dose: "1 capsule",
        time: "1:00 PM",
        taken: false,
      },
      {
        name: "Calcium 600mg",
        dose: "1 tablet",
        time: "1:30 PM",
        taken: false,
      },
    ],

    night: [
      {
        name: "Atorvastatin 10mg",
        dose: "1 tablet",
        time: "8:00 PM",
        taken: false,
      },
      {
        name: "Omeprazole 20mg",
        dose: "1 capsule",
        time: "9:00 PM",
        taken: false,
      },
    ],
  };

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

  const handleAddMedicine = (e) => {
    e.preventDefault();

    if (!newMedicine.name || !newMedicine.dosage) {
      return;
    }

    const stockValue = Number(newMedicine.stock) || 0;

    const medicine = {
      id: Date.now(),
      name: newMedicine.name,
      dosage: newMedicine.dosage,
      schedule: newMedicine.schedule || "As prescribed",
      stock: stockValue,
      unit: newMedicine.unit,
      status: stockValue <= 10 ? "Low Stock" : "Good",
    };

    setMedicines((prev) => [...prev, medicine]);

    setNewMedicine({
      name: "",
      dosage: "",
      schedule: "",
      stock: "",
      unit: "tablets",
    });

    setShowAddMedicine(false);
  };

  const deleteMedicine = (id) => {
    setMedicines((prev) =>
      prev.filter((medicine) => medicine.id !== id)
    );
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
            <small>active medicines</small>
          </div>

        </div>


        <div className="medicine-summary-card blue-card">

          <div className="summary-icon">
            <FaCalendarCheck />
          </div>

          <div>
            <span>Medicines Today</span>
            <strong>6</strong>
            <small>to be taken</small>
          </div>

        </div>


        <div className="medicine-summary-card orange-card">

          <div className="summary-icon">
            <FaTriangleExclamation />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>
              {medicines.filter(
                (medicine) => medicine.stock <= 10
              ).length}
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
            <strong>1</strong>
            <small>this week</small>
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
                Tuesday, 16 September 2026
              </p>
            </div>

            <button className="view-schedule-btn">
              View Schedule →
            </button>

          </div>


          {/* MORNING */}

          <div className="medicine-time-group morning-group">

            <div className="time-label">
              <FaSun />
              <strong>Morning (2)</strong>
            </div>

            <div className="dose-list">

              {todayMedicines.morning.map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.name}
                >

                  <span className="dose-status taken">
                    <FaCheck />
                  </span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dose} • {medicine.time}
                  </span>

                  <span className="dose-badge taken-badge">
                    Taken
                  </span>

                </div>
              ))}

            </div>

          </div>


          {/* AFTERNOON */}

          <div className="medicine-time-group afternoon-group">

            <div className="time-label">
              <FaCloudSun />
              <strong>Afternoon (2)</strong>
            </div>

            <div className="dose-list">

              {todayMedicines.afternoon.map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.name}
                >

                  <span className="dose-status pending">
                    <FaCircle />
                  </span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dose} • {medicine.time}
                  </span>

                  <span className="dose-badge pending-badge">
                    Pending
                  </span>

                </div>
              ))}

            </div>

          </div>


          {/* NIGHT */}

          <div className="medicine-time-group night-group">

            <div className="time-label">
              <FaMoon />
              <strong>Night (2)</strong>
            </div>

            <div className="dose-list">

              {todayMedicines.night.map((medicine) => (
                <div
                  className="dose-row"
                  key={medicine.name}
                >

                  <span className="dose-status pending">
                    <FaCircle />
                  </span>

                  <strong>{medicine.name}</strong>

                  <span className="dose-time">
                    {medicine.dose} • {medicine.time}
                  </span>

                  <span className="dose-badge pending-badge">
                    Pending
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

              <button
                onClick={() => setShowAddMedicine(true)}
                className="action-item add-action"
              >
                <FaPlus />
                <span>Add Medicine</span>
              </button>

              <button className="action-item reminder-action">
                <FaBell />
                <span>Set Reminder</span>
              </button>

              <button className="action-item refill-action">
                <FaRotate />
                <span>Request Refill</span>
              </button>

              <button className="action-item report-action">
                <FaChartSimple />
                <span>View Reports</span>
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

              <button>
                View All →
              </button>

            </div>


            <div className="refill-item">

              <div className="refill-icon">
                <FaPills />
              </div>

              <div className="refill-info">
                <strong>Metformin 500mg</strong>
                <span>Low stock · 8 tablets left</span>
              </div>

              <button className="refill-now">
                Refill Now
              </button>

            </div>


            <div className="refill-item">

              <div className="refill-icon">
                <FaPills />
              </div>

              <div className="refill-info">
                <strong>Vitamin D3</strong>
                <span>Low stock · 5 capsules left</span>
              </div>

              <button className="refill-now">
                Refill Now
              </button>

            </div>

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

                      <button title="Edit">
                        <FaPenToSquare />
                      </button>

                      <button
                        title="Delete"
                        onClick={() =>
                          deleteMedicine(medicine.id)
                        }
                      >
                        <FaTrash />
                      </button>

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

      {showAddMedicine && (

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
                  Add Medicine
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


                <div className="form-group">

                  <label>
                    Unit
                  </label>

                  <select
                    name="unit"
                    value={newMedicine.unit}
                    onChange={handleInputChange}
                  >
                    <option value="tablets">
                      Tablets
                    </option>

                    <option value="capsules">
                      Capsules
                    </option>

                    <option value="bottles">
                      Bottles
                    </option>

                  </select>

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
                  Add Medicine
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaPills,
  FaCalendarCheck,
  FaArrowRight,
  FaCircleCheck,
  FaCircleExclamation,
  FaTriangleExclamation,
  FaRobot,
  FaClock,
  FaUserDoctor,
  FaArrowTrendUp,
} from "react-icons/fa6";

import {
  getMedicines,
  getAppointments,
} from "../../services/api/familyApi";

import "../../styles/family/OverviewSection.css";


/* =========================================================
   HELPERS
========================================================= */

function getElderId(selectedElder) {
  if (!selectedElder) return null;

  /*
    /connections/family/elders/ returns a relationship object.
    The elder field contains the ElderProfile ID.
  */

  if (typeof selectedElder.elder === "number") {
    return selectedElder.elder;
  }

  if (typeof selectedElder.elder === "string") {
    return selectedElder.elder;
  }

  if (selectedElder.elder?.id) {
    return selectedElder.elder.id;
  }

  if (selectedElder.elder_id) {
    return selectedElder.elder_id;
  }

  if (selectedElder.id) {
    return selectedElder.id;
  }

  return null;
}


function getFirstName(user, familyProfile) {
  const firstName =
    user?.first_name ||
    user?.firstName ||
    familyProfile?.first_name ||
    familyProfile?.firstName;

  if (firstName) return firstName;

  const fullName =
    user?.name ||
    user?.full_name ||
    familyProfile?.name ||
    familyProfile?.full_name;

  if (fullName) {
    return fullName.split(" ")[0];
  }

  return "Family";
}


function formatAppointmentDate(dateValue) {
  if (!dateValue) return "Date not available";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}


function formatAppointmentTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}


function getRelativeAppointmentText(dateValue) {
  if (!dateValue) return "";

  const appointmentDate = new Date(dateValue);

  if (Number.isNaN(appointmentDate.getTime())) {
    return "";
  }

  const now = new Date();

  const difference =
    appointmentDate.getTime() - now.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  if (difference < 0) {
    return "Completed";
  }

  if (days <= 0) {
    return "Today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  return `In ${days} days`;
}


function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}


function isThisWeek(dateValue) {
  if (!dateValue) return false;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();

  /*
    Convert Sunday-based JS day to Monday-based week.
  */
  const differenceToMonday =
    day === 0 ? -6 : 1 - day;

  startOfWeek.setDate(
    startOfWeek.getDate() + differenceToMonday
  );

  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return (
    date >= startOfWeek &&
    date < endOfWeek
  );
}


function getMedicineQuantity(medicine) {
  const quantity = Number(medicine?.quantity);

  if (Number.isNaN(quantity)) {
    return 0;
  }

  return quantity;
}


function getMedicineThreshold(medicine) {
  const threshold =
    Number(medicine?.low_stock_threshold);

  if (Number.isNaN(threshold)) {
    return 0;
  }

  return threshold;
}


/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  icon,
  title,
  description,
  onClick,
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
      type="button"
    >
      <div className="quick-action-icon">
        {icon}
      </div>

      <div className="quick-action-content">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <FaArrowRight className="quick-action-arrow" />
    </button>
  );
}


/* =========================================================
   APPOINTMENT
========================================================= */

function Appointment({
  appointment,
  onClick,
}) {
  const appointmentDate =
    appointment?.appointment_at;

  return (
    <div
      className="appointment-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onClick();
        }
      }}
    >
      <div className="appointment-date">
        <span>
          {formatAppointmentDate(appointmentDate)}
        </span>

        <small>
          {formatAppointmentTime(appointmentDate)}
        </small>
      </div>

      <div className="appointment-info">
        <strong>
          {appointment?.reason ||
            "Medical Appointment"}
        </strong>

        <span>
          <FaUserDoctor />
          {appointment?.doctor_name ||
            "Doctor not specified"}
        </span>

        {appointment?.clinic_name && (
          <small>
            {appointment.clinic_name}
          </small>
        )}
      </div>

      <div className="appointment-status">
        {getRelativeAppointmentText(
          appointmentDate
        )}
      </div>
    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function OverviewSection({
  user,
  familyProfile,
  selectedElder,
  onAddElder,
}) {
  const navigate = useNavigate();

  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] =
    useState([]);

  const [loadingMedicines, setLoadingMedicines] =
    useState(true);

  const [loadingAppointments, setLoadingAppointments] =
    useState(true);

  const [medicineError, setMedicineError] =
    useState("");

  const [appointmentError, setAppointmentError] =
    useState("");

  const elderId = getElderId(selectedElder);

  const firstName = getFirstName(
    user,
    familyProfile
  );

  const elderName =
    selectedElder?.elder_name ||
    selectedElder?.elder?.name ||
    "your parent";


  /* =======================================================
     LOAD MEDICINES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadMedicines() {
      if (!elderId) {
        setMedicines([]);
        setLoadingMedicines(false);
        return;
      }

      try {
        setLoadingMedicines(true);
        setMedicineError("");

        const data =
          await getMedicines(elderId);

        if (mounted) {
          setMedicines(
            Array.isArray(data) ? data : []
          );
        }
      } catch (error) {
        console.error(
          "Overview medicine loading error:",
          error
        );

        if (mounted) {
          setMedicineError(
            error.message ||
              "Unable to load medicines."
          );
        }
      } finally {
        if (mounted) {
          setLoadingMedicines(false);
        }
      }
    }

    loadMedicines();

    return () => {
      mounted = false;
    };
  }, [elderId]);


  /* =======================================================
     LOAD APPOINTMENTS
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadAppointments() {
      if (!elderId) {
        setAppointments([]);
        setLoadingAppointments(false);
        return;
      }

      try {
        setLoadingAppointments(true);
        setAppointmentError("");

        const data =
          await getAppointments(elderId);

        if (mounted) {
          setAppointments(
            Array.isArray(data) ? data : []
          );
        }
      } catch (error) {
        console.error(
          "Overview appointment loading error:",
          error
        );

        if (mounted) {
          setAppointmentError(
            error.message ||
              "Unable to load appointments."
          );
        }
      } finally {
        if (mounted) {
          setLoadingAppointments(false);
        }
      }
    }

    loadAppointments();

    return () => {
      mounted = false;
    };
  }, [elderId]);


  /* =======================================================
     MEDICINE STATISTICS
  ======================================================= */

  const medicineStats = useMemo(() => {
    let available = 0;
    let low = 0;
    let out = 0;

    medicines.forEach((medicine) => {
      const quantity =
        getMedicineQuantity(medicine);

      const threshold =
        getMedicineThreshold(medicine);

      if (quantity <= 0) {
        out += 1;
      } else if (
        threshold > 0 &&
        quantity <= threshold
      ) {
        low += 1;
      } else {
        available += 1;
      }
    });

    return {
      total: medicines.length,
      available,
      low,
      out,
    };
  }, [medicines]);


  /* =======================================================
     TODAY'S MEDICINES
     
     The backend provides medicine records, but does not
     provide dose-completion history in this endpoint.

     Therefore we don't invent "taken" numbers.
  ======================================================= */

  const todayMedicines = useMemo(() => {
    return medicines.filter(
      (medicine) =>
        medicine?.is_active !== false
    );
  }, [medicines]);


  /* =======================================================
     APPOINTMENT STATISTICS
  ======================================================= */

  const upcomingAppointments = useMemo(() => {
    const now = new Date();

    return appointments
      .filter((appointment) => {
        if (!appointment?.appointment_at) {
          return false;
        }

        const date = new Date(
          appointment.appointment_at
        );

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        return date >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.appointment_at) -
          new Date(b.appointment_at)
      );
  }, [appointments]);


  const appointmentsThisWeek = useMemo(() => {
    return appointments.filter((appointment) =>
      isThisWeek(
        appointment?.appointment_at
      )
    ).length;
  }, [appointments]);


  const nextAppointment =
    upcomingAppointments.length > 0
      ? upcomingAppointments[0]
      : null;


  /* =======================================================
     MEDICINE STOCK CHART DATA
  ======================================================= */

  const medicineChart = useMemo(() => {
    return [
      {
        label: "Available",
        value: medicineStats.available,
        className: "stock-available",
      },
      {
        label: "Low Stock",
        value: medicineStats.low,
        className: "stock-low",
      },
      {
        label: "Out of Stock",
        value: medicineStats.out,
        className: "stock-out",
      },
    ];
  }, [medicineStats]);


  const medicineTotal =
    medicineStats.available +
    medicineStats.low +
    medicineStats.out;


  /* =======================================================
     NO ELDER
  ======================================================= */

  if (!selectedElder) {
    return (
      <section className="overview">

        <div className="welcome-banner">

          {/* Decorative clouds */}
          <div className="welcome-cloud cloud-one"></div>
          <div className="welcome-cloud cloud-two"></div>
          <div className="welcome-cloud cloud-three"></div>

          <div className="welcome-content">

            <h1>
              Welcome back, {firstName}! 
            </h1>

            <p>
              Here's an overview of your loved one's care today.
            </p>

          </div>


          {/* Quote */}
          <div className="welcome-quote">
              “A little care
            <br />
            goes a long way.” ❤️

            <span>
              Care Creates
              <br />
              Happier Days”
            </span>
          </div>

          {/* Decorative leaves */}
          <div className="welcome-leaves">
            🌿🌿🌿
          </div>

        </div>

        {/* =================================================
          NO ELDER CONNECTED
      ================================================= */}

      <div className="overview-empty-state">

        <div className="overview-empty-icon">
          <FaPills />
        </div>

        <h2>
          No elder connected yet
        </h2>

        <p>
          Connect your parent or loved one to see their
          medicines, appointments, and care information
          here.
        </p>

        <span className="overview-connect-hint">
          Use the <button type="button" onClick={onAddElder}>+ Add Elder</button> button in the
          header to connect an elder profile.
        </span>

      </div>

      </section>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section className="overview">

      {/* =====================================================
          WELCOME BANNER
          ===================================================== */}

      <div className="welcome-banner">

        {/* Decorative clouds */}
        <div className="welcome-cloud cloud-one"></div>
        <div className="welcome-cloud cloud-two"></div>
        <div className="welcome-cloud cloud-three"></div>

        <div className="welcome-content">

          <h1>
            Welcome back, {firstName}! 
          </h1>

          <p>
            Here's an overview of your loved one's care today.
          </p>

        </div>


        {/* Quote */}
        <div className="welcome-quote">
          “A little care
          <br />
          goes a long way.” ❤️

          <span>
            Care Creates
            <br />
            Happier Days”
          </span>
        </div>


        {/* Decorative leaves */}
        <div className="welcome-leaves">
          🌿🌿🌿
        </div>

      </div>


      {/* =================================================
          KPI CARDS
      ================================================= */}

      <div className="overview-kpi-grid">

        {/* MEDICINES */}

        <div
          className="overview-kpi-card medicine-kpi"
          onClick={() =>
            navigate("/dashboard/family/medicine")
          }
          role="button"
          tabIndex={0}
        >

          <div className="overview-kpi-icon">
            <FaPills />
          </div>

          <div className="overview-kpi-content">

            <span>
              Medicine Stock
            </span>

            {loadingMedicines ? (
              <strong>...</strong>
            ) : (
              <strong>
                {medicineStats.total}
              </strong>
            )}

            <small>
              {loadingMedicines
                ? "Loading..."
                : `${medicineStats.low} low stock`}
            </small>

          </div>

          <FaArrowRight className="kpi-arrow" />

        </div>


        {/* APPOINTMENTS */}

        <div
          className="overview-kpi-card appointment-kpi"
          onClick={() =>
            navigate(
              "/dashboard/family/appointments"
            )
          }
          role="button"
          tabIndex={0}
        >

          <div className="overview-kpi-icon">
            <FaCalendarCheck />
          </div>

          <div className="overview-kpi-content">

            <span>
              Appointments This Week
            </span>

            {loadingAppointments ? (
              <strong>...</strong>
            ) : (
              <strong>
                {appointmentsThisWeek}
              </strong>
            )}

            <small>
              {nextAppointment
                ? `Next: ${formatAppointmentDate(
                    nextAppointment.appointment_at
                  )}`
                : "No upcoming appointments"}
            </small>

          </div>

          <FaArrowRight className="kpi-arrow" />

        </div>


        {/* NEXT APPOINTMENT */}

        <div className="overview-kpi-card next-kpi">

          <div className="overview-kpi-icon">
            <FaClock />
          </div>

          <div className="overview-kpi-content">

            <span>
              Next Appointment
            </span>

            {loadingAppointments ? (
              <strong>...</strong>
            ) : nextAppointment ? (
              <>
                <strong>
                  {formatAppointmentDate(
                    nextAppointment.appointment_at
                  )}
                </strong>

                <small>
                  {formatAppointmentTime(
                    nextAppointment.appointment_at
                  )}
                </small>
              </>
            ) : (
              <>
                <strong>None</strong>
                <small>
                  No upcoming appointment
                </small>
              </>
            )}

          </div>

        </div>

      </div>


      {/* =================================================
          MAIN GRID
      ================================================= */}

      <div className="overview-main-grid">

        {/* =================================================
            MEDICINE STOCK
        ================================================= */}

        <div className="overview-card medicine-stock-card">

          <div className="overview-card-header">

            <div>
              <span className="card-eyebrow">
                Medication
              </span>

              <h2>
                Medicine Stock
              </h2>

              <p>
                Current medicine availability
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/family/medicine"
                )
              }
            >
              View Details
              <FaArrowRight />
            </button>

          </div>


          {loadingMedicines ? (
            <div className="overview-loading">
              Loading medicine information...
            </div>
          ) : medicineError ? (
            <div className="overview-inline-error">
              <FaTriangleExclamation />
              <span>{medicineError}</span>
            </div>
          ) : (
            <>

              <div className="medicine-stock-summary">

                <div className="stock-total">
                  <strong>
                    {medicineTotal}
                  </strong>

                  <span>
                    Total Medicines
                  </span>
                </div>

                <div className="stock-items">

                  {medicineChart.map((item) => (
                    <div
                      className="stock-item"
                      key={item.label}
                    >

                      <div
                        className={`stock-indicator ${item.className}`}
                      ></div>

                      <span>
                        {item.label}
                      </span>

                      <strong>
                        {item.value}
                      </strong>

                    </div>
                  ))}

                </div>

              </div>


              <div className="medicine-stock-bar">

                {medicineTotal > 0 && (
                  <>
                    {medicineStats.available >
                      0 && (
                      <div
                        className="stock-bar-available"
                        style={{
                          width: `${
                            (medicineStats.available /
                              medicineTotal) *
                            100
                          }%`,
                        }}
                      />
                    )}

                    {medicineStats.low > 0 && (
                      <div
                        className="stock-bar-low"
                        style={{
                          width: `${
                            (medicineStats.low /
                              medicineTotal) *
                            100
                          }%`,
                        }}
                      />
                    )}

                    {medicineStats.out > 0 && (
                      <div
                        className="stock-bar-out"
                        style={{
                          width: `${
                            (medicineStats.out /
                              medicineTotal) *
                            100
                          }%`,
                        }}
                      />
                    )}
                  </>
                )}

              </div>

            </>
          )}

        </div>


        {/* =================================================
            TODAY'S MEDICINES
        ================================================= */}

        <div className="overview-card today-medicine-card">

          <div className="overview-card-header">

            <div>
              <span className="card-eyebrow">
                Medication
              </span>

              <h2>
                Today's Medicines
              </h2>
            </div>

            <FaPills className="header-card-icon" />

          </div>


          {loadingMedicines ? (
            <div className="overview-loading">
              Loading...
            </div>
          ) : medicineError ? (
            <div className="overview-inline-error">
              <FaTriangleExclamation />
              <span>
                Unable to load medicines.
              </span>
            </div>
          ) : todayMedicines.length === 0 ? (
            <div className="overview-no-data">
              <FaCircleCheck />
              <p>
                No active medicines found.
              </p>
            </div>
          ) : (
            <>

              <div className="today-medicine-count">

                <div>
                  <strong>
                    {todayMedicines.length}
                  </strong>

                  <span>
                    Active medicines
                  </span>
                </div>

                <FaCircleCheck />

              </div>


              <div className="today-medicine-list">

                {todayMedicines
                  .slice(0, 4)
                  .map((medicine) => {

                    const quantity =
                      getMedicineQuantity(
                        medicine
                      );

                    const threshold =
                      getMedicineThreshold(
                        medicine
                      );

                    const isOut =
                      quantity <= 0;

                    const isLow =
                      !isOut &&
                      threshold > 0 &&
                      quantity <= threshold;

                    return (
                      <div
                        className="today-medicine-item"
                        key={medicine.id}
                      >

                        <div className="medicine-item-icon">
                          <FaPills />
                        </div>

                        <div className="medicine-item-info">

                          <strong>
                            {medicine.name}
                          </strong>

                          <span>
                            {medicine.dosage ||
                              "Dosage not specified"}
                          </span>

                        </div>

                        <div
                          className={
                            isOut
                              ? "medicine-stock-status out"
                              : isLow
                                ? "medicine-stock-status low"
                                : "medicine-stock-status good"
                          }
                        >
                          {isOut
                            ? "Out"
                            : isLow
                              ? "Low"
                              : "Available"}
                        </div>

                      </div>
                    );
                  })}

              </div>


              {todayMedicines.length > 4 && (
                <button
                  className="overview-text-button"
                  type="button"
                  onClick={() =>
                    navigate(
                      "/dashboard/family/medicine"
                    )
                  }
                >
                  View all medicines
                  <FaArrowRight />
                </button>
              )}

            </>
          )}

        </div>

      </div>


      {/* =================================================
          UPCOMING APPOINTMENTS
      ================================================= */}

      <div className="overview-card upcoming-appointments-card">

        <div className="overview-card-header">

          <div>
            <span className="card-eyebrow">
              Schedule
            </span>

            <h2>
              Upcoming Appointments
            </h2>

            <p>
              Your parent's upcoming medical visits
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/family/appointments"
              )
            }
          >
            View All
            <FaArrowRight />
          </button>

        </div>


        {loadingAppointments ? (
          <div className="overview-loading">
            Loading appointments...
          </div>
        ) : appointmentError ? (
          <div className="overview-inline-error">
            <FaTriangleExclamation />
            <span>{appointmentError}</span>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="overview-no-data">
            <FaCalendarCheck />

            <p>
              No upcoming appointments.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/dashboard/family/appointments"
                )
              }
            >
              Add Appointment
            </button>
          </div>
        ) : (
          <div className="appointments-list">

            {upcomingAppointments
              .slice(0, 3)
              .map((appointment) => (
                <Appointment
                  key={appointment.id}
                  appointment={appointment}
                  onClick={() =>
                    navigate(
                      "/dashboard/family/appointments"
                    )
                  }
                />
              ))}

          </div>
        )}

      </div>


      {/* =================================================
          AI COMPANION SUMMARY
          
          The current backend does not expose a structured
          mood/summary endpoint for the family Overview.
          Therefore we do not invent AI information.
        ================================================= */}

      <div className="overview-card ai-summary-card">

        <div className="overview-card-header">

          <div>
            <span className="card-eyebrow">
              CareConnect AI
            </span>

            <h2>
              AI Companion Summary
            </h2>

            <p>
              Your parent's companion activity
            </p>
          </div>

          <div className="ai-summary-icon">
            <FaRobot />
          </div>

        </div>


        <div className="ai-summary-content">

          <div className="ai-summary-message">

            <FaRobot />

            <div>
              <strong>
                AI Companion data
              </strong>

              <p>
                AI companion activity and mood
                summaries will appear here when
                the companion backend provides
                family summary data.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate(
                "/dashboard/family/ai-companion"
              )
            }
          >
            Open AI Companion
            <FaArrowRight />
          </button>

        </div>

      </div>


      {/* =================================================
          QUICK ACTIONS
      ================================================= */}

      <div className="overview-quick-actions">

        <div className="quick-actions-heading">

          <div>
            <span className="card-eyebrow">
              Care Management
            </span>

            <h2>
              Quick Actions
            </h2>
          </div>

        </div>


        <div className="quick-actions-grid">

          <QuickAction
            icon={<FaPills />}
            title="Manage Medicines"
            description="View and manage medications"
            onClick={() =>
              navigate(
                "/dashboard/family/medicine"
              )
            }
          />

          <QuickAction
            icon={<FaCalendarCheck />}
            title="Appointments"
            description="Manage upcoming appointments"
            onClick={() =>
              navigate(
                "/dashboard/family/appointments"
              )
            }
          />

          <QuickAction
            icon={<FaRobot />}
            title="AI Companion"
            description="View companion activity"
            onClick={() =>
              navigate(
                "/dashboard/family/ai-companion"
              )
            }
          />

          <QuickAction
            icon={<FaArrowTrendUp />}
            title="Parent Profile"
            description="View your parent's profile"
            onClick={() =>
              navigate(
                "/dashboard/family/profile"
              )
            }
          />

        </div>

      </div>


      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="overview-footer">

        <FaCircleCheck />

        <span>
          CareConnect is keeping you informed
          about {elderName}'s care.
        </span>

      </div>

    </section>
  );
}
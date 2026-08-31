import React, { useEffect, useState } from "react";

import FamilySidebar from "../../components/family/FamilySidebar";
import FamilyHeader from "../../components/family/FamilyHeader";
import ElderSelector from "../../components/family/ElderSelector";

import OverviewSection from "../../components/family/OverviewSection";
import MedicinesSection from "../../components/family/MedicinesSection";
import AppointmentsSection from "../../components/family/AppointmentsSection";
import EmergencyContactsSection from "../../components/family/EmergencyContactsSection";
import ProfileSection from "../../components/family/ProfileSection";

import ConnectElder from "../../components/ConnectElder";

import {
  getMe,
  getFamilyProfile,
  getConnectedElders,

  getMedicines,
  createMedicine,
  updateMedicine,
  deleteMedicine,

  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,

  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "../../services/api/familyApi";


export default function FamilyDashboard() {

  /* =====================================================
     BASIC USER / FAMILY DATA
  ===================================================== */

  const [user, setUser] = useState(null);

  const [familyProfile, setFamilyProfile] =
    useState(null);


  /* =====================================================
     CONNECTED ELDERS
  ===================================================== */

  const [elders, setElders] = useState([]);

  const [selectedElder, setSelectedElder] =
    useState(null);


  /* =====================================================
     ELDER DATA
  ===================================================== */

  const [medicines, setMedicines] =
    useState([]);

  const [appointments, setAppointments] =
    useState([]);

  const [emergencyContacts, setEmergencyContacts] =
    useState([]);


  /* =====================================================
     DASHBOARD STATE
  ===================================================== */

  const [activeSection, setActiveSection] =
    useState("overview");

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [elderDataLoading, setElderDataLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =====================================================
     INITIAL DASHBOARD LOAD
  ===================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);


  /* =====================================================
     LOAD DATA WHEN ELDER CHANGES
  ===================================================== */

  useEffect(() => {

    if (selectedElder?.id) {

      loadElderData(
        selectedElder.id
      );

    } else {

      setMedicines([]);
      setAppointments([]);
      setEmergencyContacts([]);

    }

  }, [selectedElder]);


  /* =====================================================
     LOAD FAMILY DASHBOARD
  ===================================================== */

  async function loadDashboard() {

    try {

      setDashboardLoading(true);
      setError("");

      const [
        meData,
        familyData,
        elderData,
      ] = await Promise.all([
        getMe(),
        getFamilyProfile(),
        getConnectedElders(),
      ]);


      /* -------------------------------
         USER
      ------------------------------- */

      setUser(meData);


      /* -------------------------------
         FAMILY PROFILE
      ------------------------------- */

      setFamilyProfile(
        familyData
      );


      /* -------------------------------
         CONNECTED ELDERS
      ------------------------------- */

      const elderList =
        Array.isArray(elderData)
          ? elderData
          : Array.isArray(
              elderData?.results
            )
          ? elderData.results
          : [];


      setElders(
        elderList
      );


      /* -------------------------------
         SELECT FIRST ELDER
      ------------------------------- */

      if (elderList.length > 0) {

        setSelectedElder(
          elderList[0]
        );

      } else {

        setSelectedElder(
          null
        );

      }

    } catch (err) {

      console.error(
        "Family dashboard load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load family dashboard data."
      );

    } finally {

      setDashboardLoading(false);

    }

  }


  /* =====================================================
     LOAD SELECTED ELDER DATA
  ===================================================== */

  async function loadElderData(
    elderId
  ) {

    try {

      setElderDataLoading(true);
      setError("");

      const [
        medicineData,
        appointmentData,
        emergencyData,
      ] = await Promise.all([

        getMedicines(
          elderId
        ),

        getAppointments(
          elderId
        ),

        getEmergencyContacts(
          elderId
        ),

      ]);


      /* -------------------------------
         MEDICINES
      ------------------------------- */

      setMedicines(
        Array.isArray(
          medicineData
        )
          ? medicineData
          : []
      );


      /* -------------------------------
         APPOINTMENTS
      ------------------------------- */

      setAppointments(
        Array.isArray(
          appointmentData
        )
          ? appointmentData
          : []
      );


      /* -------------------------------
         EMERGENCY CONTACTS
      ------------------------------- */

      setEmergencyContacts(
        Array.isArray(
          emergencyData
        )
          ? emergencyData
          : []
      );


    } catch (err) {

      console.error(
        "Elder data load error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load elder data."
      );

    } finally {

      setElderDataLoading(false);

    }

  }


  /* =====================================================
     REFRESH ELDER DATA
  ===================================================== */

  async function refreshElderData() {

    if (!selectedElder?.id) {
      return;
    }

    await loadElderData(
      selectedElder.id
    );

  }


  /* =====================================================
     CONNECT ELDER SUCCESS
  ===================================================== */

  async function handleConnectionSuccess() {

    try {

      setError("");

      /*
       * Reload connected elders.
       *
       * This is important because the newly
       * accepted connection should appear
       * inside ElderSelector.
       */

      const elderData =
        await getConnectedElders();


      const elderList =
        Array.isArray(elderData)
          ? elderData
          : Array.isArray(
              elderData?.results
            )
          ? elderData.results
          : [];


      setElders(
        elderList
      );


      /*
       * Select the newly connected elder.
       *
       * If there was no elder before,
       * select the first one.
       */

      if (elderList.length > 0) {

        setSelectedElder(
          elderList[
            elderList.length - 1
          ]
        );

      }


      /*
       * Move user back to overview
       */

      setActiveSection(
        "overview"
      );


    } catch (err) {

      console.error(
        "Refresh connected elders error:",
        err
      );

      setError(
        err?.message ||
          "Connection was successful, but the dashboard could not be refreshed."
      );

    }

  }


  /* =====================================================
     MEDICINES
  ===================================================== */

  async function handleCreateMedicine(
    data
  ) {

    try {

      setError("");

      await createMedicine({

        ...data,

        elder_id:
          selectedElder.id,

      });

      await refreshElderData();

    } catch (err) {

      console.error(
        "Create medicine error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add medicine."
      );

      throw err;

    }

  }


  async function handleUpdateMedicine(
    id,
    data
  ) {

    try {

      setError("");

      await updateMedicine(
        id,
        data
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Update medicine error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update medicine."
      );

      throw err;

    }

  }


  async function handleDeleteMedicine(
    id
  ) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this medicine?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await deleteMedicine(
        id
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Delete medicine error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete medicine."
      );

    }

  }


  /* =====================================================
     APPOINTMENTS
  ===================================================== */

  async function handleCreateAppointment(
    data
  ) {

    try {

      setError("");

      await createAppointment({

        ...data,

        elder_id:
          selectedElder.id,

      });

      await refreshElderData();

    } catch (err) {

      console.error(
        "Create appointment error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add appointment."
      );

      throw err;

    }

  }


  async function handleUpdateAppointment(
    id,
    data
  ) {

    try {

      setError("");

      await updateAppointment(
        id,
        data
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Update appointment error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update appointment."
      );

      throw err;

    }

  }


  async function handleDeleteAppointment(
    id
  ) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this appointment?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await deleteAppointment(
        id
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Delete appointment error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete appointment."
      );

    }

  }


  /* =====================================================
     EMERGENCY CONTACTS
  ===================================================== */

  async function handleCreateEmergencyContact(
    data
  ) {

    try {

      setError("");

      await createEmergencyContact({

        ...data,

        elder_id:
          selectedElder.id,

      });

      await refreshElderData();

    } catch (err) {

      console.error(
        "Create emergency contact error:",
        err
      );

      setError(
        err?.message ||
          "Unable to add emergency contact."
      );

      throw err;

    }

  }


  async function handleUpdateEmergencyContact(
    id,
    data
  ) {

    try {

      setError("");

      await updateEmergencyContact(
        id,
        data
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Update emergency contact error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update emergency contact."
      );

      throw err;

    }

  }


  async function handleDeleteEmergencyContact(
    id
  ) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this emergency contact?"
      );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await deleteEmergencyContact(
        id
      );

      await refreshElderData();

    } catch (err) {

      console.error(
        "Delete emergency contact error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete emergency contact."
      );

    }

  }


  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (dashboardLoading) {

    return (
      <div className="family-loading-screen">

        <div className="big-spinner" />

        <h2>
          Loading CareConnect...
        </h2>

        <p>
          Preparing your family dashboard
        </p>

      </div>
    );

  }


  /* =====================================================
     RENDER
  ===================================================== */

  return (

    <div className="family-dashboard-shell">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <FamilySidebar

        activeSection={
          activeSection
        }

        onChange={
          setActiveSection
        }

        user={
          user
        }

      />


      {/* =================================================
          MAIN
      ================================================= */}

      <div className="family-dashboard-main">

        <FamilyHeader
          user={user}
        />


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="family-error-banner">

            <div>

              <strong>
                Unable to complete the request
              </strong>

              <span>
                {error}
              </span>

            </div>

            <button
              type="button"
              onClick={() => {

                setError("");

                if (
                  selectedElder?.id
                ) {

                  loadElderData(
                    selectedElder.id
                  );

                } else {

                  loadDashboard();

                }

              }}
            >
              Retry
            </button>

          </div>

        )}


        {/* =================================================
            DASHBOARD CONTENT
        ================================================= */}

        <main className="family-dashboard-content">


          {/* =================================================
              CONNECT ELDER SECTION

              IMPORTANT:
              This is outside the selected-elder condition.

              Therefore a family member can connect an elder
              even when they currently have ZERO elders.
          ================================================= */}

          {activeSection === "connect" && (

            <ConnectElder

              onSuccess={
                handleConnectionSuccess
              }

            />

          )}


          {/* =================================================
              ELDER SELECTOR

              Hide it while the user is connecting an elder.
          ================================================= */}

          {activeSection !== "connect" && (

            <ElderSelector

              elders={
                elders
              }

              selectedElder={
                selectedElder
              }

              onChange={
                setSelectedElder
              }

            />

          )}


          {/* =================================================
              NO ELDER
          ================================================= */}

          {activeSection !== "connect" &&
            !selectedElder ? (

            <NoElderState
              onConnect={() =>
                setActiveSection(
                  "connect"
                )
              }
            />

          ) : null}


          {/* =================================================
              CONNECTED ELDER DASHBOARD
          ================================================= */}

          {activeSection !== "connect" &&
            selectedElder && (

            <>

              {/* ---------------------------------------------
                  OVERVIEW
              --------------------------------------------- */}

              {activeSection === "overview" && (

                <OverviewSection

                  medicines={
                    medicines
                  }

                  appointments={
                    appointments
                  }

                  contacts={
                    emergencyContacts
                  }

                  onNavigate={
                    setActiveSection
                  }

                />

              )}


              {/* ---------------------------------------------
                  MEDICINES
              --------------------------------------------- */}

              {activeSection === "medicines" && (

                <MedicinesSection

                  medicines={
                    medicines
                  }

                  loading={
                    elderDataLoading
                  }

                  onCreate={
                    handleCreateMedicine
                  }

                  onUpdate={
                    handleUpdateMedicine
                  }

                  onDelete={
                    handleDeleteMedicine
                  }

                />

              )}


              {/* ---------------------------------------------
                  APPOINTMENTS
              --------------------------------------------- */}

              {activeSection ===
                "appointments" && (

                <AppointmentsSection

                  appointments={
                    appointments
                  }

                  loading={
                    elderDataLoading
                  }

                  onCreate={
                    handleCreateAppointment
                  }

                  onUpdate={
                    handleUpdateAppointment
                  }

                  onDelete={
                    handleDeleteAppointment
                  }

                />

              )}


              {/* ---------------------------------------------
                  EMERGENCY CONTACTS
              --------------------------------------------- */}

              {activeSection ===
                "emergency" && (

                <EmergencyContactsSection

                  contacts={
                    emergencyContacts
                  }

                  loading={
                    elderDataLoading
                  }

                  onCreate={
                    handleCreateEmergencyContact
                  }

                  onUpdate={
                    handleUpdateEmergencyContact
                  }

                  onDelete={
                    handleDeleteEmergencyContact
                  }

                />

              )}


              {/* ---------------------------------------------
                  FAMILY PROFILE
              --------------------------------------------- */}

              {activeSection === "profile" && (

                <ProfileSection

                  user={
                    user
                  }

                  profile={
                    familyProfile
                  }

                />

              )}

            </>

          )}

        </main>

      </div>

    </div>

  );

}


/* =========================================================
   NO ELDER STATE
========================================================= */

function NoElderState({
  onConnect,
}) {

  return (

    <section className="no-elder-state">

      <div className="no-elder-icon">
        ♥
      </div>

      <h2>
        No elder connected yet
      </h2>

      <p>
        Connect with an elder using their
        CareConnect ID to start managing
        medicines, appointments and
        emergency contacts.
      </p>

      <button
        type="button"
        className="connect-elder-button"
        onClick={onConnect}
      >
        Connect an Elder
      </button>

    </section>

  );

}
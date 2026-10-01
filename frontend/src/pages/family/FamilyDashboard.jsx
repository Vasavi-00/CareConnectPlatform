import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import FamilyHeader from "../../components/family/FamilyHeader";
import FamilySidebar from "../../components/family/FamilySidebar";

import OverviewSection from "../../components/family/OverviewSection";
import AppointmentsPage from "../../components/family/AppointmentsPage";
import MedicinePage from "../../components/family/MedicinePage";
import AICompanionPage from "../../components/family/AICompanionPage";
import NotificationsPage from "../../components/family/NotificationsPage";
import ParentProfilePage from "../../components/family/ParentProfilePage";
import SettingsPage from "../../components/family/SettingsPage";
import HelpPage from "../../components/family/HelpPage";

import {
  getMe,
  getFamilyProfile,
  getConnectedElders,
} from "../../services/api/familyApi";

import "../../styles/family/FamilyDashboard.css";

export default function FamilyDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [user, setUser] = useState(null);
  const [familyProfile, setFamilyProfile] = useState(null);
  const [elders, setElders] = useState([]);
  const [selectedElder, setSelectedElder] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();

  const refreshConnectedElders = async () => {
    const data = await getConnectedElders();
    const connectedElders = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    setElders(connectedElders);
    setSelectedElder((current) =>
      connectedElders.find((elder) => elder.elder_id === current?.elder_id) || connectedElders[0] || null
    );
  };

  // =========================================================
  // LOAD FAMILY DASHBOARD DATA
  // =========================================================

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [meData, familyData, elderData] =
          await Promise.all([
            getMe(),
            getFamilyProfile(),
            getConnectedElders(),
          ]);

        // Backend returns { user: {...} }
        const loggedInUser = meData?.user || null;

        const connectedElders = Array.isArray(elderData)
          ? elderData
          : Array.isArray(elderData?.results)
            ? elderData.results
            : [];

        console.log("LOGGED IN USER:", loggedInUser);
        console.log("FAMILY PROFILE:", familyData);
        console.log("CONNECTED ELDERS:", connectedElders);

        setUser(loggedInUser);
        setFamilyProfile(familyData);
        setElders(connectedElders);

        // Select first connected elder automatically
        if (connectedElders.length > 0) {
          setSelectedElder(connectedElders[0]);
        } else {
          setSelectedElder(null);
        }

      } catch (err) {
        console.error(
          "Family dashboard loading error:",
          err
        );

        setError(
          err.message ||
          "Unable to load family dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  // =========================================================
  // SCROLL TO TOP WHEN PAGE CHANGES
  // =========================================================

  useEffect(() => {
    if (location.hash) return;

    const main = document.querySelector(".main");

    if (main) {
      main.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto",
      });
    }
  }, [location.pathname, location.hash]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="family-dashboard-loading">
        <div className="family-loading-spinner"></div>
        <h2>Loading CareConnect...</h2>
        <p>
          Preparing your family care dashboard.
        </p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div className="family-dashboard-error">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>

        <button
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="dashboard">

      <FamilyHeader
        user={user}
        elders={elders}
        selectedElder={selectedElder}
        onSelectElder={setSelectedElder}
        onElderConnected={refreshConnectedElders}
        familyProfile={familyProfile}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="dashboard-body">

        <FamilySidebar
          sidebarOpen={sidebarOpen}
        />

        <main className="main">

          <Routes>

            {/* OVERVIEW */}
            <Route
              index
              element={
                <OverviewSection
                  user={user}
                  familyProfile={familyProfile}
                  selectedElder={selectedElder}
                />
              }
            />

            {/* APPOINTMENTS */}
            <Route
              path="appointments"
              element={
                <AppointmentsPage
                  selectedElder={selectedElder}
                  elders={elders}
                />
              }
            />

            {/* MEDICINES */}
            <Route
              path="medicine"
              element={
                <MedicinePage
                  selectedElder={selectedElder}
                />
              }
            />

            {/* AI COMPANION */}
            <Route
              path="ai-companion"
              element={
                <AICompanionPage
                  selectedElder={selectedElder}
                />
              }
            />

            {/* NOTIFICATIONS */}
            <Route
              path="notifications"
              element={
                <NotificationsPage
                  selectedElder={selectedElder}
                />
              }
            />

            {/* PROFILE */}
            <Route
              path="profile"
              element={
                <ParentProfilePage
                  selectedElder={selectedElder}
                  onElderProfileUpdated={(updated) => {
                    const applyUpdate = (elder) => {
                      if (String(elder?.elder_id || elder?.id) !== String(updated.id)) return elder;
                      const fullName = `${updated.first_name || ""} ${updated.last_name || ""}`.trim();
                      return {
                        ...elder,
                        ...updated,
                        elder_id: elder.elder_id || updated.id,
                        elder_name: fullName || elder.elder_name,
                        elder_phone: updated.phone ?? elder.elder_phone,
                        elder_date_of_birth: updated.date_of_birth ?? elder.elder_date_of_birth,
                        elder_gender: updated.gender ?? elder.elder_gender,
                        elder_address: updated.address ?? elder.elder_address,
                        elder_city: updated.city ?? elder.elder_city,
                        elder_state: updated.state ?? elder.elder_state,
                        elder_pincode: updated.pincode ?? elder.elder_pincode,
                        elder_preferred_language: updated.preferred_language ?? elder.elder_preferred_language,
                        elder_medical_notes: updated.medical_notes ?? elder.elder_medical_notes,
                        elder_emergency_notes: updated.emergency_notes ?? elder.elder_emergency_notes,
                      };
                    };
                    setElders((current) => current.map(applyUpdate));
                    setSelectedElder((current) => applyUpdate(current));
                  }}
                />
              }
            />

            {/* SETTINGS */}
            <Route
              path="settings"
              element={
                <SettingsPage
                  user={user}
                  familyProfile={familyProfile}
                  onProfileUpdated={(updated) => {
                    setFamilyProfile((current) => ({ ...current, ...updated }));
                    setUser((current) => ({
                      ...current,
                      first_name: updated.first_name ?? current?.first_name,
                      last_name: updated.last_name ?? current?.last_name,
                      phone: updated.phone ?? current?.phone,
                    }));
                  }}
                />
              }
            />

            {/* HELP */}
            <Route
              path="help"
              element={<HelpPage />}
            />

          </Routes>

        </main>

      </div>

    </div>
  );
}

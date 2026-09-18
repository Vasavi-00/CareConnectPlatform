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
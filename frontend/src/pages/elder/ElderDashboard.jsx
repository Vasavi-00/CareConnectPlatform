import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import ElderHeader from "../../components/elder/ElderHeader";
import ElderSidebar from "../../components/elder/ElderSidebar";
import ElderOverviewSection from "../../components/elder/ElderOverviewSection";
import ElderMedicinesPage from "../../components/elder/ElderMedicinesPage";
import ElderAppointmentsPage from "../../components/elder/ElderAppointmentsPage";
import ElderFamilyPage from "../../components/elder/ElderFamilyPage";
import ElderNotificationsPage from "../../components/elder/ElderNotificationsPage";
import ElderAICompanionPage from "../../components/elder/ElderAICompanionPage";
import ElderSOSPage from "../../components/elder/ElderSOSPage";
import ElderSOSModal from "../../components/elder/ElderSOSModal";
import ElderProfilePage from "../../components/elder/ElderProfilePage";
import { speakText } from "../../services/voice/speechSynthesis";

import {
  getMe,
  getElderProfile,
  getMedicines,
  getAppointments,
  getNotifications,
  getUnreadNotificationCount,
  getConnectedFamily,
  getEmergencyContacts,
  takeMedicine,
} from "../../services/api/elderApi";

import "../../styles/elder/elder-dashboard.css";

export default function ElderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [voiceRemindersEnabled, setVoiceRemindersEnabled] = useState(() =>
    localStorage.getItem("careconnect_voice_medicine_reminders") === "enabled"
  );
  const [dueMedicine, setDueMedicine] = useState(null);
  const [reminderError, setReminderError] = useState("");
  const [markingDose, setMarkingDose] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosStatus, setSosStatus] = useState(null);

  const [mood, setMood] = useState(() => {
    return localStorage.getItem("careconnect_mood") || "good";
  });

  const location = useLocation();

  // Load all real data from backend
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const [meData, profileData] = await Promise.all([
        getMe(),
        getElderProfile(),
      ]);

      const meUser = meData?.user || meData || null;
      const elderProf = profileData?.profile || profileData || null;

      setUser(meUser);
      setProfile(elderProf);

      // Apply accessibility settings if set
      if (elderProf?.font_size) {
        document.body.classList.remove(
          "elder-font-normal",
          "elder-font-large",
          "elder-font-xlarge"
        );
        document.body.classList.add(`elder-font-${elderProf.font_size}`);
      }

      if (elderProf?.high_contrast) {
        document.body.classList.add("elder-high-contrast");
      }

      const elderId = elderProf?.id;
      if (elderId) {
        const [
          medsData,
          apptsData,
          notifsData,
          unreadData,
          famData,
          contactsData,
        ] = await Promise.all([
          getMedicines(elderId),
          getAppointments(elderId),
          getNotifications(),
          getUnreadNotificationCount(),
          getConnectedFamily(),
          getEmergencyContacts(elderId),
        ]);

        setMedicines(Array.isArray(medsData) ? medsData : []);
        setAppointments(Array.isArray(apptsData) ? apptsData : []);
        setNotifications(Array.isArray(notifsData) ? notifsData : []);
        setUnreadCount(Number(unreadData?.unread_count || 0));
        setFamilyMembers(Array.isArray(famData) ? famData : []);
        setEmergencyContacts(Array.isArray(contactsData) ? contactsData : []);
      }
    } catch (err) {
      console.error("Elder dashboard loading error:", err);
      setError(err?.message || "Unable to load elder dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 800);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Check the schedule while the elder dashboard is open. Speech starts only
  // after the elder enables it with a tap, as required by browsers.
  useEffect(() => {
    const checkDueMedicines = () => {
      const now = new Date();
      const dateKey = now.toLocaleDateString("en-CA");
      const minuteOfDay = now.getHours() * 60 + now.getMinutes();
      const taken = JSON.parse(localStorage.getItem("careconnect_elder_taken_doses") || "{}");
      const announced = JSON.parse(localStorage.getItem("careconnect_elder_announced_doses") || "{}");
      let due = null;

      for (const medicine of medicines) {
        if (medicine.is_active === false || (medicine.quantity ?? 1) <= 0) continue;
        const entries = Array.isArray(medicine.times) ? medicine.times : [medicine.timing];
        for (const entry of entries) {
          const timeMatch = String(typeof entry === "object" ? entry.time || "" : entry || "").match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/);
          if (!timeMatch) continue;
          const time = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
          const scheduledMinute = Number(timeMatch[1]) * 60 + Number(timeMatch[2]);
          const key = `${dateKey}:${medicine.id}:${time}`;
          if (taken[key] || minuteOfDay < scheduledMinute) continue;
          due = { medicine, time, key };
          if (voiceRemindersEnabled && minuteOfDay - scheduledMinute <= 2 && !announced[key]) {
            const telugu = profile?.preferred_language === "Telugu";
            speakText(
              telugu
                ? `మందు సమయం అయింది. దయచేసి ${medicine.name}, ${medicine.dosage || ""} తీసుకోండి. తీసుకున్న తర్వాత తీసుకున్నట్లు గుర్తించండి.`
                : `It is time to take ${medicine.name}, ${medicine.dosage || ""}. Please take it now, then mark it as taken.`,
              telugu ? "te-IN" : "en-IN",
              profile?.voice_speed || 1
            );
            localStorage.setItem("careconnect_elder_announced_doses", JSON.stringify({ ...announced, [key]: true }));
          }
          break;
        }
        if (due) break;
      }
      setDueMedicine(due);
    };

    checkDueMedicines();
    const interval = window.setInterval(checkDueMedicines, 15000);
    return () => window.clearInterval(interval);
  }, [medicines, profile, voiceRemindersEnabled]);

  const enableVoiceReminders = () => {
    localStorage.setItem("careconnect_voice_medicine_reminders", "enabled");
    setVoiceRemindersEnabled(true);
    speakText(profile?.preferred_language === "Telugu" ? "మందుల వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి." : "Voice medicine reminders are on.", profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN", profile?.voice_speed || 1);
  };

  const markDueMedicineTaken = async () => {
    if (!dueMedicine || markingDose) return;
    setMarkingDose(true);
    setReminderError("");
    try {
      await takeMedicine(dueMedicine.medicine.id, dueMedicine.medicine.quantity);
      const taken = JSON.parse(localStorage.getItem("careconnect_elder_taken_doses") || "{}");
      localStorage.setItem("careconnect_elder_taken_doses", JSON.stringify({ ...taken, [dueMedicine.key]: new Date().toISOString() }));
      setDueMedicine(null);
      await loadDashboardData();
    } catch (err) {
      setReminderError(err?.message || "Unable to record this dose. Please try again.");
    } finally {
      setMarkingDose(false);
    }
  };

  // Refresh notifications specifically
  const refreshNotifications = async () => {
    try {
      const [notifsData, unreadData] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      setUnreadCount(Number(unreadData?.unread_count || 0));
    } catch (err) {
      console.error("Notification refresh error:", err);
    }
  };

  // Scroll to top on navigation change
  useEffect(() => {
    const mainEl = document.querySelector(".elder-main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="elder-dashboard-loading">
        <div className="elder-loading-spinner" />
        <h2>Loading CareConnect Elder Care...</h2>
        <p>Preparing your care schedule and health updates.</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="elder-dashboard-error">
        <h2>Unable to load your dashboard</h2>
        <p>{error}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="elder-dashboard-shell">
      {dueMedicine && (
        <div className="elder-dose-reminder" role="status">
          <div><strong>Medicine reminder</strong><span>It’s time for {dueMedicine.medicine.name} ({dueMedicine.medicine.dosage || "scheduled dose"}) at {dueMedicine.time}.</span></div>
          <button type="button" onClick={markDueMedicineTaken} disabled={markingDose}>{markingDose ? "Saving…" : "I took it"}</button>
          {reminderError && <small role="alert">{reminderError}</small>}
        </div>
      )}
      {/* 1. TOP NAVIGATION HEADER */}
      <ElderHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        profile={profile}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefreshNotifications={refreshNotifications}
      />

      <div className="elder-dashboard-body">
        {/* 2. DARK NAVY LEFT SIDEBAR */}
        <ElderSidebar
          sidebarOpen={sidebarOpen}
          unreadCount={unreadCount}
          onTriggerSos={() => setSosModalOpen(true)}
        />

        {/* 3. MAIN BRIGHT BLUE CONTENT AREA */}
        <main className="elder-main">
          <Routes>
            <Route
              index
              element={
                <ElderOverviewSection
                  user={user}
                  profile={profile}
                  medicines={medicines}
                  appointments={appointments}
                  notifications={notifications}
                  familyMembers={familyMembers}
                  unreadCount={unreadCount}
                  mood={mood}
                  setMood={setMood}
                  onOpenSosModal={() => setSosModalOpen(true)}
                  onRefreshData={loadDashboardData}
                  voiceRemindersEnabled={voiceRemindersEnabled}
                  onEnableVoiceReminders={enableVoiceReminders}
                />
              }
            />
            <Route
              path="dashboard"
              element={
                <ElderOverviewSection
                  user={user}
                  profile={profile}
                  medicines={medicines}
                  appointments={appointments}
                  notifications={notifications}
                  familyMembers={familyMembers}
                  unreadCount={unreadCount}
                  mood={mood}
                  setMood={setMood}
                  onOpenSosModal={() => setSosModalOpen(true)}
                  onRefreshData={loadDashboardData}
                  voiceRemindersEnabled={voiceRemindersEnabled}
                  onEnableVoiceReminders={enableVoiceReminders}
                />
              }
            />
            <Route
              path="medicines"
              element={
                <ElderMedicinesPage
                  medicines={medicines}
                  profile={profile}
                  onRefreshData={loadDashboardData}
                />
              }
            />
            <Route
              path="appointments"
              element={<ElderAppointmentsPage appointments={appointments} />}
            />
            <Route
              path="family"
              element={<ElderFamilyPage familyMembers={familyMembers} />}
            />
            <Route
              path="notifications"
              element={
                <ElderNotificationsPage
                  notifications={notifications}
                  profile={profile}
                  onRefreshNotifications={refreshNotifications}
                />
              }
            />
            <Route
              path="ai"
              element={
                <ElderAICompanionPage
                  user={user}
                  profile={profile}
                  medicines={medicines}
                  appointments={appointments}
                  familyMembers={familyMembers}
                  mood={mood}
                  onOpenSosModal={() => setSosModalOpen(true)}
                />
              }
            />
            <Route
              path="ai-companion"
              element={<Navigate to="/elder/ai" replace />}
            />
            <Route
              path="sos"
              element={
                <ElderSOSPage
                  emergencyContacts={emergencyContacts}
                  sosStatus={sosStatus}
                  onOpenSosModal={() => setSosModalOpen(true)}
                />
              }
            />
            <Route
              path="profile"
              element={
                <ElderProfilePage
                  user={user}
                  profile={profile}
                  onProfileUpdated={(updated) => {
                    setProfile((prev) => ({ ...prev, ...updated }));
                    setUser((prev) => ({
                      ...prev,
                      first_name: updated.first_name ?? prev?.first_name,
                      last_name: updated.last_name ?? prev?.last_name,
                      phone: updated.phone ?? prev?.phone,
                    }));
                  }}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/elder/dashboard" replace />}
            />
          </Routes>
        </main>
      </div>

      {/* 4. GLOBAL SOS CONFIRMATION MODAL */}
      <ElderSOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        onSosActivated={(res) => {
          setSosStatus({
            message: "Family has been notified and emergency contact alerted.",
            contact: res?.contact,
          });
          refreshNotifications();
        }}
      />
    </div>
  );
}

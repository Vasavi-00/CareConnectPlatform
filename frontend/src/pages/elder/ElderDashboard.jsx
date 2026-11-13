import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Link,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
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
import ElderChatbotWidget from "../../components/elder/ElderChatbotWidget";
import {
  FaStop,
  FaVolumeXmark,
  FaCalendarCheck,
} from "react-icons/fa6";
import {
  announceNotification, getVoiceNotificationSettings, queueSpeech,
  saveVoiceNotificationSettings, speakText, stopSpeaking,
} from "../../services/voice/speechSynthesis";

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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState(() => getVoiceNotificationSettings());
  const voiceRemindersEnabled = voiceSettings.enabled;
  const medicinesVoiceEnabled = voiceSettings.medicinesEnabled;
  const appointmentsVoiceEnabled = voiceSettings.appointmentsEnabled;
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [dueMedicine, setDueMedicine] = useState(null);
  const [dueAppointment, setDueAppointment] = useState(null);
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
  const lastGuidedPath = useRef(null);
  const knownNotificationIds = useRef(null);

  useEffect(() => {
    if (loading || !profile || lastGuidedPath.current === location.pathname) return;
    lastGuidedPath.current = location.pathname;
    if (!voiceRemindersEnabled || !profile.voice_enabled) return;

    const guidance = {
      "/elder": "Welcome to your home screen. You can open medicines, appointments, family, or your companion from the menu.",
      "/elder/dashboard": "Welcome to your home screen. You can open medicines, appointments, family, or your companion from the menu.",
      "/elder/medicines": "Your medicine schedule is open. Check each medicine and its time here.",
      "/elder/appointments": "Your appointments are open. You can hear the details or ask your family for help.",
      "/elder/ai": "Your companion is ready. Tap the microphone to speak, or type your message below.",
      "/elder/sos": "This is the emergency help screen. Choose a trusted contact or use the SOS option.",
    };
    const message = guidance[location.pathname];
    if (message) {
      speakText(message, profile.preferred_language === "Telugu" ? "te-IN" : "en-IN", profile.voice_speed || 1);
    }
  }, [location.pathname, loading, profile, voiceRemindersEnabled]);

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
    const onVoiceSettings = (event) => {
      const next = event.detail || getVoiceNotificationSettings();
      setVoiceSettings(next);
      if (!next.enabled) {
        stopSpeaking();
        setIsSpeechActive(false);
      }
    };

    const onSpeechStatus = (event) => {
      const state = event.detail?.state;
      if (state === "speaking" || state === "processing") {
        setIsSpeechActive(true);
      } else if (
        state === "idle" ||
        state === "stopped" ||
        state === "error" ||
        state === "unsupported" ||
        state === "interrupted"
      ) {
        setIsSpeechActive(false);
      }
    };

    window.addEventListener("careconnect-voice-settings", onVoiceSettings);
    window.addEventListener("careconnect-speech-status", onSpeechStatus);

    return () => {
      window.removeEventListener("careconnect-voice-settings", onVoiceSettings);
      window.removeEventListener("careconnect-speech-status", onSpeechStatus);
    };
  }, []);

  useEffect(() => {
    if (loading || !profile || !Array.isArray(notifications)) return;
    if (!voiceRemindersEnabled || !profile.voice_enabled) return;
    const ids = new Set(notifications.map((item) => String(item.id)));
    if (knownNotificationIds.current === null) {
      knownNotificationIds.current = ids;
      return;
    }
    const previous = knownNotificationIds.current;
    knownNotificationIds.current = new Set([...previous, ...ids].slice(-300));
    notifications
      .filter((item) => !previous.has(String(item.id)) && !item.is_read)
      .forEach((item) => {
        const appointment = item.related_object_type === "appointment"
          ? appointments.find((record) => String(record.id) === String(item.related_object_id))
          : null;
        announceNotification(item, profile, undefined, appointment);
      });
  }, [notifications, profile, appointments, loading, voiceRemindersEnabled]);

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

  useEffect(() => {
    if (window.innerWidth <= 800) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen || window.innerWidth > 800) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  // Check the schedule while the elder dashboard is open (both medicines and appointments)
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const dateKey = now.toLocaleDateString("en-CA");
      const minuteOfDay = now.getHours() * 60 + now.getMinutes();
      const taken = JSON.parse(localStorage.getItem("careconnect_elder_taken_doses") || "{}");
      let due = null;

      // 1. Medicine schedule check
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
          if (voiceRemindersEnabled && medicinesVoiceEnabled && profile?.voice_enabled !== false && minuteOfDay - scheduledMinute <= 2) {
            const telugu = profile?.preferred_language === "Telugu";
            const settings = getVoiceNotificationSettings();
            const announcementText = settings.readDetails
              ? (telugu
                  ? `మందు సమయం అయింది. దయచేసి ${medicine.name}, ${medicine.dosage || ""} తీసుకోండి. తీసుకున్న తర్వాత తీసుకున్నట్లు గుర్తించండి.`
                  : `It is time to take ${medicine.name}, ${medicine.dosage || ""}. Please take it now, then mark it as taken.`)
              : (telugu
                  ? "మీ షెడ్యూల్ చేసిన మందుల రిమైండర్ సమయం అయింది. దయచేసి మీ షెడ్యూల్‌ను తనిఖీ చేయండి."
                  : "It's time for your scheduled medicine reminder. Please check your schedule to see the details.");
            queueSpeech(
              announcementText,
              telugu ? "te-IN" : "en-IN",
              profile?.voice_speed || 1,
              { dedupeKey: `medicine-dose:${key}`, priority: 30, voiceName: settings.voiceName, kind: "notification", rememberAsLast: true }
            );
          }
          break;
        }
        if (due) break;
      }
      setDueMedicine(due);

      // 2. Doctor appointments schedule check for today
      const todayAppointments = appointments.filter((appt) => {
        if (!appt?.appointment_at || ["CANCELLED", "CANCELED", "COMPLETED"].includes(appt.status)) return false;
        const apptDate = new Date(appt.appointment_at);
        const apptDateKey = apptDate.toLocaleDateString("en-CA");
        return apptDateKey === dateKey && apptDate >= now;
      });

      if (todayAppointments.length > 0) {
        const nextAppt = todayAppointments[0];
        setDueAppointment(nextAppt);
        if (voiceRemindersEnabled && appointmentsVoiceEnabled && profile?.voice_enabled !== false) {
          const telugu = profile?.preferred_language === "Telugu";
          const settings = getVoiceNotificationSettings();
          const apptTime = new Date(nextAppt.appointment_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          const announcementText = settings.readDetails
            ? (telugu
                ? `ఈరోజు మీకు డాక్టర్ ${nextAppt.doctor_name || "వైద్యుడు"} గారితో ${nextAppt.clinic_name || "క్లినిక్"} వద్ద ${apptTime} గంటలకు అపాయింట్‌మెంట్ ఉంది. ${nextAppt.location ? `చిరునామా: ${nextAppt.location}.` : ""}`
                : `Doctor visit reminder: You have an appointment today with ${nextAppt.doctor_name || "your doctor"} at ${nextAppt.clinic_name || "your clinic"} at ${apptTime}. ${nextAppt.location ? `Address: ${nextAppt.location}.` : ""}`)
            : (telugu
                ? `మీకు ఈరోజు డాక్టర్ ${nextAppt.doctor_name || "వైద్యుడు"} గారితో ${apptTime} గంటలకు అపాయింట్‌మెంట్ ఉంది.`
                : `Reminder: You have a doctor appointment today with ${nextAppt.doctor_name || "your doctor"} at ${apptTime}.`);
          queueSpeech(
            announcementText,
            telugu ? "te-IN" : "en-IN",
            profile?.voice_speed || 1,
            { dedupeKey: `appointment-today:${nextAppt.id}:${dateKey}`, priority: 30, voiceName: settings.voiceName, kind: "notification", rememberAsLast: true }
          );
        }
      } else {
        setDueAppointment(null);
      }
    };

    checkSchedule();
    const interval = window.setInterval(checkSchedule, 15000);
    return () => window.clearInterval(interval);
  }, [medicines, appointments, profile, voiceRemindersEnabled, medicinesVoiceEnabled, appointmentsVoiceEnabled]);

  const handleStopVoice = () => {
    stopSpeaking();
    setIsSpeechActive(false);
  };

  const handleToggleVoiceReminders = () => {
    const next = !voiceSettings.enabled;
    const updated = saveVoiceNotificationSettings({ enabled: next });
    setVoiceSettings(updated);
    if (!next) {
      stopSpeaking();
      setIsSpeechActive(false);
    } else {
      speakText(
        profile?.preferred_language === "Telugu"
          ? "వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి."
          : "Voice notifications turned on.",
        profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN",
        profile?.voice_speed || 1
      );
    }
  };

  const handleToggleMedicineVoiceReminders = () => {
    const next = !voiceSettings.medicinesEnabled;
    const updated = saveVoiceNotificationSettings({ medicinesEnabled: next });
    setVoiceSettings(updated);
    speakText(
      next
        ? (profile?.preferred_language === "Telugu"
            ? "మందుల వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి."
            : "Medicine voice reminders turned on.")
        : (profile?.preferred_language === "Telugu"
            ? "మందుల వాయిస్ రిమైండర్లు ఆపివేయబడ్డాయి."
            : "Medicine voice reminders turned off."),
      profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN",
      profile?.voice_speed || 1
    );
  };

  const handleToggleAppointmentVoiceReminders = () => {
    const next = !voiceSettings.appointmentsEnabled;
    const updated = saveVoiceNotificationSettings({ appointmentsEnabled: next });
    setVoiceSettings(updated);
    speakText(
      next
        ? (profile?.preferred_language === "Telugu"
            ? "అపాయింట్‌మెంట్ వాయిస్ రిమైండర్లు ప్రారంభించబడ్డాయి."
            : "Appointment voice reminders turned on.")
        : (profile?.preferred_language === "Telugu"
            ? "అపాయింట్‌మెంట్ వాయిస్ రిమైండర్లు ఆపివేయబడ్డాయి."
            : "Appointment voice reminders turned off."),
      profile?.preferred_language === "Telugu" ? "te-IN" : "en-IN",
      profile?.voice_speed || 1
    );
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isSpeechActive) {
        handleStopVoice();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSpeechActive]);

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
  const refreshNotifications = useCallback(async () => {
    try {
      const [notifsData, unreadData] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(Array.isArray(notifsData) ? notifsData : []);
      setUnreadCount(Number(unreadData?.unread_count || 0));
      if (profile?.id) {
        try {
          const appointmentData = await getAppointments(profile.id);
          if (Array.isArray(appointmentData)) setAppointments(appointmentData);
        } catch (err) {
          console.error("Appointment refresh error:", err);
        }
      }
    } catch (err) {
      console.error("Notification refresh error:", err);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return undefined;
    const refreshWhileOpen = () => {
      if (document.visibilityState === "visible") refreshNotifications();
    };
    const timer = window.setInterval(refreshWhileOpen, 30000);
    return () => window.clearInterval(timer);
  }, [profile, refreshNotifications]);

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
        <button type="button" onClick={loadDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="elder-dashboard-shell">
      {/* 1. TOP NAVIGATION HEADER */}
      <ElderHeader
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        profile={profile}
        notifications={notifications}
        unreadCount={unreadCount}
        onRefreshNotifications={refreshNotifications}
        isSpeechActive={isSpeechActive}
        onStopSpeech={handleStopVoice}
        voiceEnabled={voiceRemindersEnabled}
        onToggleVoice={handleToggleVoiceReminders}
      />

      {sidebarOpen && window.innerWidth <= 800 && (
        <button
          type="button"
          className="elder-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="elder-dashboard-body">
        {/* 2. DARK NAVY LEFT SIDEBAR */}
        <ElderSidebar
          sidebarOpen={sidebarOpen}
          unreadCount={unreadCount}
          onNavigate={() => {
            if (window.innerWidth <= 800) setSidebarOpen(false);
          }}
          onTriggerSos={() => setSosModalOpen(true)}
        />

        {/* 3. MAIN BRIGHT BLUE CONTENT AREA */}
        <main className="elder-main">
          {/* Active Voice Playing Banner with Stop & Mute buttons */}
          {isSpeechActive && (
            <div className="elder-active-voice-banner" role="status" aria-live="assertive">
              <div className="elder-active-voice-content">
                <div className="elder-voice-wave" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="elder-active-voice-text">
                  <strong>Voice notification is playing</strong>
                  <span>Audio guidance or alert is currently speaking aloud.</span>
                </div>
              </div>
              <div className="elder-active-voice-actions">
                <button
                  type="button"
                  className="elder-stop-voice-btn"
                  onClick={handleStopVoice}
                  title="Stop voice speech right now"
                  aria-label="Stop speaking voice notification"
                >
                  <FaStop /> Stop Voice
                </button>
                <button
                  type="button"
                  className="elder-turnoff-voice-btn"
                  onClick={handleToggleVoiceReminders}
                  title="Turn off automatic voice notifications"
                  aria-label="Turn off voice notifications"
                >
                  <FaVolumeXmark /> Turn Off
                </button>
              </div>
            </div>
          )}

          {dueMedicine && (
            <div className="elder-dose-reminder" role="status">
              <div className="elder-dose-reminder-text">
                <strong>Medicine reminder</strong>
                <span>It’s time for {dueMedicine.medicine.name} ({dueMedicine.medicine.dosage || "scheduled dose"}) at {dueMedicine.time}.</span>
              </div>
              <div className="elder-dose-reminder-btns">
                <button
                  type="button"
                  className="elder-dose-btn-repeat"
                  onClick={() => {
                    const telugu = profile?.preferred_language === "Telugu";
                    const settings = getVoiceNotificationSettings();
                    const text = settings.readDetails
                      ? (telugu
                          ? `మందు సమయం అయింది. దయచేసి ${dueMedicine.medicine.name}, ${dueMedicine.medicine.dosage || ""} తీసుకోండి.`
                          : `It is time to take ${dueMedicine.medicine.name}, ${dueMedicine.medicine.dosage || ""}.`)
                      : (telugu
                          ? "మీ షెడ్యూల్ చేసిన మందుల రిమైండర్ సమయం అయింది."
                          : "It's time for your scheduled medicine reminder.");
                    speakText(text, telugu ? "te-IN" : "en-IN", profile?.voice_speed || 1, undefined, { voiceName: settings.voiceName, rememberAsLast: true });
                  }}
                >
                  Hear reminder again
                </button>
                <button type="button" onClick={() => navigate("/elder/medicines")}>Open medicine schedule</button>
                <button type="button" onClick={markDueMedicineTaken} disabled={markingDose}>{markingDose ? "Saving…" : "I took it"}</button>
              </div>
              {reminderError && <small role="alert">{reminderError}</small>}
            </div>
          )}

          {dueAppointment && (
            <div className="elder-dose-reminder appointment-reminder-banner" role="status">
              <div className="elder-dose-reminder-text">
                <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <FaCalendarCheck /> Doctor Visit Today
                </strong>
                <span>
                  You have an appointment today with {dueAppointment.doctor_name || "Doctor"} at{" "}
                  {dueAppointment.clinic_name || "Clinic"} (
                  {new Date(dueAppointment.appointment_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                  {dueAppointment.location ? ` — ${dueAppointment.location}` : ""}.
                </span>
              </div>
              <div className="elder-dose-reminder-btns">
                <button
                  type="button"
                  className="elder-dose-btn-repeat"
                  onClick={() => {
                    const telugu = profile?.preferred_language === "Telugu";
                    const settings = getVoiceNotificationSettings();
                    const apptTime = new Date(dueAppointment.appointment_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                    const text = settings.readDetails
                      ? (telugu
                          ? `ఈరోజు మీకు డాక్టర్ ${dueAppointment.doctor_name || "వైద్యుడు"} గారితో ${dueAppointment.clinic_name || "క్లినిక్"} వద్ద ${apptTime} గంటలకు అపాయింట్‌మెంట్ ఉంది.`
                          : `Doctor visit reminder: You have an appointment today with ${dueAppointment.doctor_name || "your doctor"} at ${dueAppointment.clinic_name || "your clinic"} at ${apptTime}.`)
                      : (telugu
                          ? `మీకు ఈరోజు డాక్టర్ ${dueAppointment.doctor_name || "వైద్యుడు"} గారితో అపాయింట్‌మెంట్ ఉంది.`
                          : `Reminder: You have a doctor appointment today with ${dueAppointment.doctor_name || "your doctor"}.`);
                    speakText(text, telugu ? "te-IN" : "en-IN", profile?.voice_speed || 1, undefined, { voiceName: settings.voiceName, rememberAsLast: true });
                  }}
                >
                  Hear appointment details
                </button>
                <button type="button" onClick={() => navigate("/elder/appointments")}>View Appointments</button>
              </div>
            </div>
          )}

          <Routes>
            <Route
              index
              element={<Navigate to="dashboard" replace />}
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
                  medicinesVoiceEnabled={medicinesVoiceEnabled}
                  appointmentsVoiceEnabled={appointmentsVoiceEnabled}
                  onEnableVoiceReminders={handleToggleVoiceReminders}
                  onToggleVoiceReminders={handleToggleVoiceReminders}
                  onToggleMedicineVoiceReminders={handleToggleMedicineVoiceReminders}
                  onToggleAppointmentVoiceReminders={handleToggleAppointmentVoiceReminders}
                  isSpeechActive={isSpeechActive}
                  onStopVoice={handleStopVoice}
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
                  medicinesVoiceEnabled={medicinesVoiceEnabled}
                  onToggleMedicineVoiceReminders={handleToggleMedicineVoiceReminders}
                />
              }
            />
            <Route
              path="appointments"
              element={
                <ElderAppointmentsPage
                  appointments={appointments}
                  profile={profile}
                  appointmentsVoiceEnabled={appointmentsVoiceEnabled}
                  onToggleAppointmentVoiceReminders={handleToggleAppointmentVoiceReminders}
                />
              }
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
                  appointments={appointments}
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
              element={(
                <section className="elder-route-not-found" role="status">
                  <h1>Page not found</h1>
                  <p>This CareConnect page does not exist.</p>
                  <Link to="/elder/dashboard">Return to home</Link>
                </section>
              )}
            />
          </Routes>
        </main>
      </div>

      {/* 4. GLOBAL SOS CONFIRMATION MODAL */}
      <ElderSOSModal
        isOpen={sosModalOpen}
        emergencyContacts={emergencyContacts}
        onClose={() => setSosModalOpen(false)}
        onSosActivated={(res) => {
          setSosStatus({
            status: res?.status,
            message: res?.status === "CANCELLED"
              ? "Emergency request cancelled."
              : res?.notification_recipient_count > 0
              ? `In-app alert saved for ${res.notification_recipient_count} authorized family member(s).`
              : res?.notification_status === "FAILED"
                ? "SOS saved, but the family alert could not be saved. Call your emergency contact."
                : "SOS saved, but no authorized family recipient was found. Call your emergency contact.",
            contact: res?.contact,
          });
          refreshNotifications();
        }}
      />

      {/* 5. FLOATING AI COMPANION CHATBOT (RIGHT CORNER) */}
      <ElderChatbotWidget
        user={user}
        profile={profile}
        medicines={medicines}
        appointments={appointments}
        familyMembers={familyMembers}
        onOpenSosModal={() => setSosModalOpen(true)}
        voiceRemindersEnabled={voiceRemindersEnabled}
      />
    </div>
  );
}

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaPills,
  FaCalendarCheck,
  FaHeart,
  FaBell,
  FaRobot,
  FaArrowRight,
  FaPhone,
  FaCheck,
  FaClock,
  FaCircleCheck,
  FaTriangleExclamation,
  FaMicrophone,
  FaVolumeHigh,
} from "react-icons/fa6";

import { takeMedicine, markNotificationRead } from "../../services/api/elderApi";
import { speakText, stopSpeaking } from "../../services/voice/speechSynthesis";

const MOOD_OPTIONS = [
  { id: "good", label: "Good", emoji: "😊" },
  { id: "okay", label: "Okay", emoji: "😐" },
  { id: "not-well", label: "Not feeling well", emoji: "😔" },
];

export default function ElderOverviewSection({
  user,
  profile,
  medicines = [],
  appointments = [],
  notifications = [],
  familyMembers = [],
  unreadCount = 0,
  mood,
  setMood,
  onOpenSosModal,
  onRefreshData,
}) {
  const navigate = useNavigate();

  const [takenPills, setTakenPills] = useState(() => {
    try {
      const stored = localStorage.getItem("careconnect_elder_taken_pills");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [takingId, setTakingId] = useState(null);
  const [successToast, setSuccessToast] = useState("");

  // AI Companion local state
  const [aiInput, setAiInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiChat, setAiChat] = useState(() => [
    {
      id: "intro",
      sender: "ai",
      text: profile?.preferred_language === "Telugu"
        ? "నమస్కారం! నేను మీ కేర్ కనెక్ట్ కంపానియన్. ఈ రోజు మీకు ఏమైనా సహాయం కావాలా?"
        : "Hello! I am your CareConnect Companion. I'm here whenever you want to talk or check your care.",
    },
  ]);

  const firstName =
    profile?.first_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Friend";

  const isTelugu = profile?.preferred_language === "Telugu";

  // Helpers
  const nextMedicine = medicines.length > 0 ? medicines[0] : null;

  const upcomingAppointments = appointments
    .filter((a) => {
      if (!a?.appointment_at) return false;
      return new Date(a.appointment_at) >= new Date();
    })
    .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));

  const nextAppointment =
    upcomingAppointments.length > 0 ? upcomingAppointments[0] : null;

  const recentNotifications = notifications.slice(0, 3);

  // "I Took This Medicine" action
  const handleTakeMedicine = async (medicine) => {
    if (!medicine?.id || takingId) return;

    try {
      setTakingId(medicine.id);
      await takeMedicine(medicine.id, medicine.quantity);

      const updated = {
        ...takenPills,
        [medicine.id]: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setTakenPills(updated);
      localStorage.setItem(
        "careconnect_elder_taken_pills",
        JSON.stringify(updated)
      );

      setSuccessToast(`Marked ${medicine.name} as taken!`);
      setTimeout(() => setSuccessToast(""), 3500);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error("Failed to take medicine:", err);
      setSuccessToast("Unable to record medicine right now.");
      setTimeout(() => setSuccessToast(""), 3500);
    } finally {
      setTakingId(null);
    }
  };

  // Mark notification read on click
  const handleNotificationClick = async (item) => {
    if (!item?.id) return;
    if (!item.is_read) {
      try {
        await markNotificationRead(item.id);
        if (onRefreshData) {
          onRefreshData();
        }
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }
  };

  // AI Response generator with empathetic + care reasoning
  const handleAiSend = (queryText) => {
    const text = (queryText || aiInput).trim();
    if (!text) return;

    const lower = text.toLowerCase();
    let reply = "";
    let offerSos = false;
    let offerFamilyCall = false;

    if (isTelugu) {
      if (
        lower.includes("fall") ||
        lower.includes("chest") ||
        lower.includes("pain") ||
        lower.includes("నొప్పి") ||
        lower.includes("పడిపోయా") ||
        lower.includes("ఊపిరి")
      ) {
        reply =
          "ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే ఎమర్జెన్సీ సహాయం తీసుకోండి. నేను మీకోసం ఎమర్జెన్సీ హెల్ప్ ప్రారంభించాలా?";
        offerSos = true;
      } else if (
        lower.includes("lonely") ||
        lower.includes("sad") ||
        lower.includes("miss") ||
        lower.includes("బాధ") ||
        lower.includes("ఒంటరి")
      ) {
        reply =
          "నేను మీతోనే ఉన్నాను. మీరు ఒంటరిగా ఉండవలసిన అవసరం లేదు. మీ కుటుంబ సభ్యులకు కాల్ చేయడానికి నేను సహాయం చేయాలా?";
        offerFamilyCall = true;
      } else if (
        lower.includes("medicine") ||
        lower.includes("మందు") ||
        lower.includes("టాబ్లెట్")
      ) {
        reply = nextMedicine
          ? `మీ తదుపరి మందు ${nextMedicine.name} (${nextMedicine.dosage}). సమయం: ${
              Array.isArray(nextMedicine.times) && nextMedicine.times.length
                ? nextMedicine.times[0]
                : "నిర్ణయించబడిన సమయం"
            }. ${nextMedicine.food_timing || ""}.`
          : "ప్రస్తుతం మీకు ఎలాంటి షెడ్యూల్డ్ మందులు లేవు.";
      } else if (
        lower.includes("appointment") ||
        lower.includes("డాక్టర్") ||
        lower.includes("హాస్పిటల్")
      ) {
        reply = nextAppointment
          ? `మీ తదుపరి అపాయింట్‌మెంట్ ${nextAppointment.doctor_name}తో ${new Date(
              nextAppointment.appointment_at
            ).toLocaleDateString("te-IN")}లో ఉంది.`
          : "ప్రస్తుతం మీకు ఎలాంటి అపాయింట్‌మెంట్‌లు లేవు.";
      } else {
        reply =
          "నేను మీ మాట వింటున్నాను. మీ ఆరోగ్యం, మందులు, లేదా కుటుంబం గురించి ఏమైనా అడగండి.";
      }
    } else {
      if (
        lower.includes("fall") ||
        lower.includes("fell") ||
        lower.includes("cannot breathe") ||
        lower.includes("chest") ||
        lower.includes("hurt") ||
        lower.includes("emergency")
      ) {
        reply =
          "This sounds like a potential emergency. Please do not worry, we are right here. Would you like me to activate Emergency Help for you now?";
        offerSos = true;
      } else if (
        lower.includes("lonely") ||
        lower.includes("alone") ||
        lower.includes("sad") ||
        lower.includes("miss") ||
        lower.includes("bored") ||
        lower.includes("worried")
      ) {
        reply =
          "I am right here with you. It is completely okay to feel this way. Would you like me to help you connect with your family right now?";
        offerFamilyCall = true;
      } else if (
        lower.includes("medicine") ||
        lower.includes("pill") ||
        lower.includes("tablet")
      ) {
        reply = nextMedicine
          ? `Your next medicine is ${nextMedicine.name} (${nextMedicine.dosage}) scheduled for ${
              Array.isArray(nextMedicine.times) && nextMedicine.times.length
                ? nextMedicine.times[0]
                : "your regular time"
            } (${nextMedicine.food_timing || "with water"}).`
          : "You do not have any pending medicines scheduled right now.";
      } else if (
        lower.includes("appointment") ||
        lower.includes("doctor") ||
        lower.includes("clinic")
      ) {
        reply = nextAppointment
          ? `Your next appointment is with ${nextAppointment.doctor_name} at ${
              nextAppointment.clinic_name
            } on ${new Date(
              nextAppointment.appointment_at
            ).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })} at ${new Date(nextAppointment.appointment_at).toLocaleTimeString(
              "en-IN",
              { hour: "2-digit", minute: "2-digit" }
            )}.`
          : "You have no upcoming doctor visits scheduled right now.";
      } else if (
        lower.includes("family") ||
        lower.includes("son") ||
        lower.includes("daughter") ||
        lower.includes("call")
      ) {
        reply = familyMembers.length
          ? `You have ${familyMembers.length} family member${
              familyMembers.length > 1 ? "s" : ""
            } connected to CareConnect. ${
              familyMembers[0].family_name || "Your family"
            } is available to support you.`
          : "No family members are connected yet. You can ask them to link using your CareConnect ID.";
        offerFamilyCall = familyMembers.length > 0;
      } else {
        reply = `I'm here for you, ${firstName}. We're keeping track of your medicines and appointments. Tell me how you're feeling today, or ask me anything!`;
      }
    }

    const newMsgs = [
      ...aiChat,
      { id: Date.now(), sender: "elder", text },
      { id: Date.now() + 1, sender: "ai", text: reply, offerSos, offerFamilyCall },
    ];
    setAiChat(newMsgs);
    setAiInput("");

    if (profile?.voice_enabled !== false) {
      speakText(reply, isTelugu ? "te-IN" : "en-IN", profile?.voice_speed || 1);
    }
  };

  // Speech Recognition
  const handleVoiceListen = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isTelugu ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleAiSend(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="elder-overview">
      {successToast && (
        <div className="elder-toast-banner">
          <FaCheck /> {successToast}
        </div>
      )}

      {/* =====================================================
          1. WELCOME HERO SECTION
      ===================================================== */}
      <section className="elder-hero-banner">
        <div className="elder-cloud cloud-1" />
        <div className="elder-cloud cloud-2" />
        <div className="elder-cloud cloud-3" />

        <div className="elder-hero-text">
          <h1>Welcome, {firstName}! </h1>
          <p className="elder-hero-subtitle">Here is your care for today.</p>
          <p className="elder-hero-quote">
            “We're here to help you feel safe, healthy and connected.”
          </p>
        </div>

        <div className="elder-hero-leaves">🌿🌿🌿</div>
      </section>

      {/* =====================================================
          2. FEELING CHECK-IN
      ===================================================== */}
      <section className="elder-checkin-card">
        <div className="elder-checkin-header">
          <h3>How are you feeling today?</h3>
          <span>Tap the face that matches how you feel</span>
        </div>

        <div className="elder-mood-buttons">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`elder-mood-btn ${mood === opt.id ? "active" : ""}`}
              onClick={() => {
                setMood(opt.id);
                localStorage.setItem("careconnect_mood", opt.id);
              }}
            >
              <span className="mood-emoji">{opt.emoji}</span>
              <span className="mood-text">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* =====================================================
          3. THREE SUMMARY CARDS
      ===================================================== */}
      <section className="elder-summary-grid">
        {/* Card 1: Next Medicine */}
        <div
          className="elder-summary-card medicine-card-kpi"
          onClick={() => navigate("/elder/medicines")}
          role="button"
          tabIndex={0}
        >
          <div className="summary-icon medicine-icon-bg">
            <FaPills />
          </div>
          <div className="summary-info">
            <span className="summary-label">Next Medicine</span>
            <strong className="summary-main">
              {nextMedicine ? nextMedicine.name : "None scheduled"}
            </strong>
            <small className="summary-sub">
              {nextMedicine
                ? `${nextMedicine.dosage || ""} • ${
                    Array.isArray(nextMedicine.times) && nextMedicine.times.length
                      ? nextMedicine.times[0]
                      : "Today"
                  }`
                : "All clear for now"}
            </small>
          </div>
          <FaArrowRight className="summary-arrow" />
        </div>

        {/* Card 2: Today's Appointments */}
        <div
          className="elder-summary-card appointment-card-kpi"
          onClick={() => navigate("/elder/appointments")}
          role="button"
          tabIndex={0}
        >
          <div className="summary-icon appointment-icon-bg">
            <FaCalendarCheck />
          </div>
          <div className="summary-info">
            <span className="summary-label">Today's Care</span>
            <strong className="summary-main">
              {upcomingAppointments.length > 0
                ? `${upcomingAppointments.length} appointment${
                    upcomingAppointments.length > 1 ? "s" : ""
                  }`
                : "No visits today"}
            </strong>
            <small className="summary-sub">
              {nextAppointment
                ? `${nextAppointment.doctor_name || "Doctor"} • ${new Date(
                    nextAppointment.appointment_at
                  ).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Take time to relax"}
            </small>
          </div>
          <FaArrowRight className="summary-arrow" />
        </div>

        {/* Card 3: Family Updates */}
        <div
          className="elder-summary-card family-card-kpi"
          onClick={() => navigate("/elder/notifications")}
          role="button"
          tabIndex={0}
        >
          <div className="summary-icon family-icon-bg">
            <FaHeart />
          </div>
          <div className="summary-info">
            <span className="summary-label">Family Updates</span>
            <strong className="summary-main">
              {unreadCount > 0
                ? `${unreadCount} new update${unreadCount > 1 ? "s" : ""}`
                : familyMembers.length > 0
                  ? `${familyMembers.length} connected`
                  : "All clear"}
            </strong>
            <small className="summary-sub">
              {recentNotifications.length > 0
                ? recentNotifications[0].title
                : familyMembers.length > 0
                  ? "Your family is linked"
                  : "Family members can connect"}
            </small>
          </div>
          <FaArrowRight className="summary-arrow" />
        </div>
      </section>

      {/* =====================================================
          4. MAIN TWO-COLUMN CONTENT GRID
      ===================================================== */}
      <div className="elder-content-columns">
        {/* LEFT COLUMN: Medication & SOS */}
        <div className="elder-column">
          {/* Today's Medicines Card */}
          <div className="elder-card today-medicines-card">
            <div className="elder-card-header">
              <div>
                <span className="card-eyebrow">MEDICATION</span>
                <h2>Today's Medicines</h2>
              </div>
              <button
                type="button"
                className="elder-card-action-btn"
                onClick={() => navigate("/elder/medicines")}
              >
                View All Medicines <FaArrowRight />
              </button>
            </div>

            {medicines.length === 0 ? (
              <div className="elder-empty-box">
                <FaCircleCheck />
                <p>No active medicines scheduled for today.</p>
              </div>
            ) : (
              <div className="elder-medicine-list">
                {medicines.slice(0, 3).map((med) => {
                  const isTaken = Boolean(takenPills[med.id]);
                  return (
                    <div key={med.id} className="elder-medicine-row">
                      <div className="med-row-icon">
                        <FaPills />
                      </div>

                      <div className="med-row-details">
                        <div className="med-title-status">
                          <strong>{med.name}</strong>
                          <span
                            className={`status-pill ${
                              isTaken ? "taken" : "due"
                            }`}
                          >
                            {isTaken
                              ? `✓ Taken at ${takenPills[med.id]}`
                              : "Due Today"}
                          </span>
                        </div>
                        <p className="med-dosage-timing">
                          {med.dosage} •{" "}
                          {Array.isArray(med.times) && med.times.length
                            ? med.times.join(", ")
                            : "Scheduled"}{" "}
                          • {med.food_timing || "Any time"}
                        </p>
                      </div>

                      <div className="med-row-action">
                        {isTaken ? (
                          <span className="taken-confirmed-badge">
                            <FaCheck /> Taken
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="btn-take-medicine"
                            onClick={() => handleTakeMedicine(med)}
                            disabled={takingId === med.id}
                          >
                            {takingId === med.id ? "Recording..." : "I Took This Medicine"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* EMERGENCY SOS BANNER CARD */}
          <div className="elder-card elder-sos-banner-card">
            <div className="sos-banner-content">
              <div className="sos-banner-icon">
                <FaTriangleExclamation />
              </div>
              <div className="sos-banner-copy">
                <h2>EMERGENCY HELP</h2>
                <p>Tap if you need immediate help or feel unsafe</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-trigger-emergency"
              onClick={onOpenSosModal}
            >
              🚨 GET EMERGENCY HELP NOW
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Appointment, Family & Updates */}
        <div className="elder-column">
          {/* Next Appointment Card */}
          <div className="elder-card appointment-card">
            <div className="elder-card-header">
              <div>
                <span className="card-eyebrow">APPOINTMENT</span>
                <h2>Next Appointment</h2>
              </div>
              <button
                type="button"
                className="elder-card-action-btn"
                onClick={() => navigate("/elder/appointments")}
              >
                View Appointment <FaArrowRight />
              </button>
            </div>

            {nextAppointment ? (
              <div className="elder-appointment-display">
                <div className="appointment-header-row">
                  <div className="doctor-badge-icon">
                    <FaCalendarCheck />
                  </div>
                  <div>
                    <h3>{nextAppointment.doctor_name}</h3>
                    <p>{nextAppointment.clinic_name || "Healthcare Clinic"}</p>
                  </div>
                </div>

                <div className="appointment-time-box">
                  <div className="time-item">
                    <FaClock />
                    <span>
                      {new Date(
                        nextAppointment.appointment_at
                      ).toLocaleDateString("en-IN", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="time-item time-highlight">
                    <span>
                      {new Date(
                        nextAppointment.appointment_at
                      ).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {nextAppointment.reason && (
                  <p className="appointment-reason">
                    <strong>Reason:</strong> {nextAppointment.reason}
                  </p>
                )}
              </div>
            ) : (
              <div className="elder-empty-box">
                <FaCalendarCheck />
                <p>No upcoming appointments scheduled.</p>
              </div>
            )}
          </div>

          {/* My Family Card */}
          <div className="elder-card family-connect-card">
            <div className="elder-card-header">
              <div>
                <span className="card-eyebrow">CONNECTED CAREGIVERS</span>
                <h2>❤️ My Family</h2>
              </div>
              <button
                type="button"
                className="elder-card-action-btn"
                onClick={() => navigate("/elder/family")}
              >
                View Family <FaArrowRight />
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="elder-empty-box">
                <FaHeart />
                <p>No family members connected yet.</p>
              </div>
            ) : (
              <div className="elder-family-list">
                {familyMembers.slice(0, 3).map((member) => (
                  <div
                    key={
                      member.id ||
                      member.family_id ||
                      member.family_email ||
                      member.family_name
                    }
                    className="elder-family-row"
                  >
                    <div className="family-avatar-pill">
                      {(member.family_name || member.name || "F")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="family-row-info">
                      <strong>
                        {member.family_name || member.name || "Family Member"}
                      </strong>
                      <span>{member.relationship_type || "Caregiver"}</span>
                    </div>

                    <button
                      type="button"
                      className="btn-call-family"
                      onClick={() => {
                        const phone = member.family_phone || member.phone;
                        if (phone) {
                          window.location.href = `tel:${phone}`;
                        } else {
                          alert(`Contacting ${member.family_name || "Family"}...`);
                        }
                      }}
                    >
                      <FaPhone /> Call
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Updates Card */}
          <div className="elder-card notifications-recent-card">
            <div className="elder-card-header">
              <div>
                <span className="card-eyebrow">ALERTS & NOTICES</span>
                <h2>🔔 Important Updates</h2>
              </div>
              <button
                type="button"
                className="elder-card-action-btn"
                onClick={() => navigate("/elder/notifications")}
              >
                View All Notifications <FaArrowRight />
              </button>
            </div>

            {recentNotifications.length === 0 ? (
              <div className="elder-empty-box">
                <FaBell />
                <p>You have no new updates.</p>
              </div>
            ) : (
              <div className="elder-updates-list">
                {recentNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`elder-update-item ${
                      !notif.is_read ? "unread" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="update-dot-icon">
                      {!notif.is_read ? (
                        <span className="blue-dot" />
                      ) : (
                        <FaCheck />
                      )}
                    </div>
                    <div className="update-item-body">
                      <strong>{notif.title}</strong>
                      <p>{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          5. AI COMPANION MAJOR VISUAL SECTION
      ===================================================== */}
      <section className="elder-ai-companion-card">
        <div className="ai-companion-top">
          <div className="ai-companion-title-wrap">
            <div className="ai-companion-robot-icon">
              <FaRobot />
            </div>
            <div>
              <h2>Your Care Companion</h2>
              <p className="ai-companion-quote">
                “I'm here whenever you want to talk.”
              </p>
              <span className="ai-companion-tagline">
                Talk • Listen • Share • Feel Better
              </span>
            </div>
          </div>

          <div className="ai-language-badge">
            <span>{isTelugu ? "తెలుగు" : "English"}</span>
          </div>
        </div>

        {/* Big Voice Button */}
        <div className="ai-voice-center">
          <button
            type="button"
            className={`ai-big-mic-btn ${isListening ? "listening" : ""}`}
            onClick={handleVoiceListen}
            aria-label="Tap to talk"
          >
            <FaMicrophone />
            <span>{isListening ? "Listening..." : "Tap to Talk"}</span>
          </button>
          <small className="ai-mic-caption">
            Press the microphone and speak naturally, or type below
          </small>
        </div>

        {/* Chat Stream */}
        <div className="ai-chat-thread">
          {aiChat.slice(-4).map((msg) => (
            <div key={msg.id} className={`ai-chat-bubble-wrap ${msg.sender}`}>
              <div className={`ai-bubble ${msg.sender}`}>
                <p>{msg.text}</p>
                {msg.offerSos && (
                  <button
                    type="button"
                    className="ai-bubble-action-btn sos"
                    onClick={onOpenSosModal}
                  >
                    🚨 Activate Emergency Help Now
                  </button>
                )}
                {msg.offerFamilyCall && familyMembers.length > 0 && (
                  <button
                    type="button"
                    className="ai-bubble-action-btn call"
                    onClick={() => {
                      const phone =
                        familyMembers[0].family_phone || familyMembers[0].phone;
                      if (phone) {
                        window.location.href = `tel:${phone}`;
                      } else {
                        navigate("/elder/family");
                      }
                    }}
                  >
                    📞 Call {familyMembers[0].family_name || "Family"} Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Text Fallback Row */}
        <div className="ai-input-fallback-row">
          <input
            type="text"
            className="ai-text-input"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAiSend();
            }}
            placeholder={
              isTelugu
                ? "మీ సందేశాన్ని ఇక్కడ రాయండి..."
                : "Type your question or thought here..."
            }
          />
          <button
            type="button"
            className="btn-send-ai"
            onClick={() => handleAiSend()}
          >
            Send
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="ai-suggestion-chips">
          <button
            type="button"
            onClick={() =>
              handleAiSend(
                isTelugu
                  ? "నాకు ఈ రోజు ఏ మందులు ఉన్నాయి?"
                  : "What medicines should I take today?"
              )
            }
          >
            💊 What medicines do I take today?
          </button>
          <button
            type="button"
            onClick={() =>
              handleAiSend(
                isTelugu
                  ? "నా తదుపరి అపాయింట్‌మెంట్ ఎప్పుడు?"
                  : "When is my next appointment?"
              )
            }
          >
            📅 When is my appointment?
          </button>
          <button
            type="button"
            onClick={() =>
              handleAiSend(
                isTelugu ? "నాకు ఒంటరిగా అనిపిస్తోంది." : "I am feeling lonely."
              )
            }
          >
            ❤️ I am feeling lonely
          </button>
          <button
            type="button"
            onClick={() =>
              handleAiSend(
                isTelugu
                  ? "నేను నా కుటుంబానికి కాల్ చేయవచ్చా?"
                  : "Can I call my family?"
              )
            }
          >
            📞 Call my family
          </button>
        </div>
      </section>
    </div>
  );
}

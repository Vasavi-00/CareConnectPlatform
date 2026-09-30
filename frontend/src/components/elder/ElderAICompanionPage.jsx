import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaRobot,
  FaMicrophone,
  FaVolumeHigh,
  FaPaperPlane,
  FaTriangleExclamation,
  FaPhone,
  FaHeart,
  FaPills,
  FaCalendarCheck,
} from "react-icons/fa6";

import { speakText, stopSpeaking } from "../../services/voice/speechSynthesis";
import { chatWithAI, getAIConversations, requestFamilyCall } from "../../services/api/elderApi";

export default function ElderAICompanionPage({
  user,
  profile,
  medicines = [],
  appointments = [],
  familyMembers = [],
  mood,
  onOpenSosModal,
}) {
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);
  const recognitionRef = useRef(null);

  const [aiInput, setAiInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedLang, setSelectedLang] = useState(
    profile?.preferred_language || "English"
  );

  const isTelugu = selectedLang === "Telugu";

  const firstName =
    profile?.first_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Friend";

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text:
        selectedLang === "Telugu"
          ? `నమస్కారం ${firstName}! నేను మీ కేర్ కనెక్ట్ కంపానియన్. మీ ఆరోగ్యం, మందులు, లేదా కుటుంబం గురించి నాతో మాట్లాడవచ్చు. ఈ రోజు మీరు ఎలా ఉన్నారు?`
          : `Hello ${firstName}! I am your CareConnect Companion. I'm always here to listen, answer questions about your medicines and appointments, or just talk whenever you'd like. How can I help you today?`,
    },
  ]);

  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadPastHistory() {
      try {
        const convs = await getAIConversations();
        if (convs && convs.length > 0 && convs[0].messages && convs[0].messages.length > 0) {
          const loaded = convs[0].messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.content,
          }));
          setMessages(loaded);
        }
      } catch (e) {
        // use default welcome message
      }
    }
    loadPastHistory();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const nextMedicine = medicines.length > 0 ? medicines[0] : null;
  const upcomingAppts = appointments
    .filter((a) => a?.appointment_at && new Date(a.appointment_at) >= new Date())
    .sort((a, b) => new Date(a.appointment_at) - new Date(b.appointment_at));
  const nextAppt = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

  const handleSend = async (userText) => {
    const text = (userText || aiInput).trim();
    if (!text || sending) return;
    setAiInput("");

    // optimistic user message
    const userMsg = { id: Date.now(), sender: "elder", text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      setSending(true);
      const res = await chatWithAI(text, selectedLang);
      const reply = res?.reply || "I am here with you. How can I help you today?";
      const offerSos = !!res?.offer_sos;
      const offerFamilyCall = !!res?.offer_family_call;

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: reply,
        offerSos,
        offerFamilyCall,
      };

      setMessages((prev) => [...prev, aiMsg]);

      if (profile?.voice_enabled !== false) {
        speakText(
          reply,
          selectedLang === "Telugu" ? "te-IN" : "en-IN",
          profile?.voice_speed || 1
        );
      }
      return;
    } catch (err) {
      console.warn("Using local companion fallback:", err);
    } finally {
      setSending(false);
    }

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
        lower.includes("ఊపిరి") ||
        lower.includes("ప్రమాదం")
      ) {
        reply =
          "ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే ఎమర్జెన్సీ సహాయం తీసుకోండి. నేను మీకోసం ఎమర్జెన్సీ హెల్ప్ ప్రారంభించాలా?";
        offerSos = true;
      } else if (
        lower.includes("lonely") ||
        lower.includes("sad") ||
        lower.includes("miss") ||
        lower.includes("బాధ") ||
        lower.includes("ఒంటరి") ||
        lower.includes("కుటుంబం")
      ) {
        reply =
          "నేను మీతోనే ఉన్నాను. మీరు ఒంటరిగా ఉండవలసిన అవసరం లేదు. మీ కుటుంబ సభ్యులకు కాల్ చేయడానికి నేను సహాయం చేయాలా?";
        offerFamilyCall = familyMembers.length > 0;
      } else if (
        lower.includes("medicine") ||
        lower.includes("మందు") ||
        lower.includes("టాబ్లెట్")
      ) {
        reply = nextMedicine
          ? `మీ తదుపరి మందు ${nextMedicine.name} (${nextMedicine.dosage}). సమయం: ${
              Array.isArray(nextMedicine.times) && nextMedicine.times.length
                ? nextMedicine.times.join(", ")
                : "నిర్ణయించబడిన సమయం"
            }. ${nextMedicine.food_timing || ""}.`
          : "ప్రస్తుతం మీకు ఎలాంటి షెడ్యూల్డ్ మందులు లేవు.";
      } else if (
        lower.includes("appointment") ||
        lower.includes("డాక్టర్") ||
        lower.includes("హాస్పిటల్")
      ) {
        reply = nextAppt
          ? `మీ తదుపరి అపాయింట్‌మెంట్ ${nextAppt.doctor_name}తో ${new Date(
              nextAppt.appointment_at
            ).toLocaleDateString("te-IN")}లో ఉంది.`
          : "ప్రస్తుతం మీకు ఎలాంటి అపాయింట్‌మెంట్‌లు లేవు.";
      } else {
        reply = `నేను వింటున్నాను ${firstName}. మీకు ఏదైనా అవసరమైనప్పుడు నేను ఎల్లప్పుడూ సిద్ధంగా ఉంటాను.`;
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
          "This sounds like an emergency. Please stay calm. Would you like me to activate Emergency Help and alert your family immediately?";
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
          "I am right here with you. You are deeply cared for, and you never have to feel alone. Would you like me to connect you with your family right now?";
        offerFamilyCall = familyMembers.length > 0;
      } else if (
        lower.includes("medicine") ||
        lower.includes("pill") ||
        lower.includes("tablet")
      ) {
        reply = nextMedicine
          ? `Your next medicine is ${nextMedicine.name} (${nextMedicine.dosage}). Scheduled for ${
              Array.isArray(nextMedicine.times) && nextMedicine.times.length
                ? nextMedicine.times.join(", ")
                : "your scheduled time"
            } (${nextMedicine.food_timing || "with water"}).`
          : "You do not have any pending medicines scheduled right now.";
      } else if (
        lower.includes("appointment") ||
        lower.includes("doctor") ||
        lower.includes("clinic")
      ) {
        reply = nextAppt
          ? `Your next appointment is with ${nextAppt.doctor_name} at ${
              nextAppt.clinic_name
            } on ${new Date(nextAppt.appointment_at).toLocaleDateString("en-IN", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })} at ${new Date(nextAppt.appointment_at).toLocaleTimeString(
              "en-IN",
              { hour: "2-digit", minute: "2-digit" }
            )}.`
          : "You do not have any upcoming doctor appointments scheduled.";
      } else if (
        lower.includes("family") ||
        lower.includes("son") ||
        lower.includes("daughter") ||
        lower.includes("call")
      ) {
        reply = familyMembers.length
          ? `You have ${familyMembers.length} family member${
              familyMembers.length > 1 ? "s" : ""
            } connected to you: ${familyMembers
              .map((m) => m.family_name || "Family")
              .join(", ")}. Would you like to call them?`
          : "No family members are currently linked to your profile.";
        offerFamilyCall = familyMembers.length > 0;
      } else {
        reply = `I am here for you, ${firstName}. We're keeping everything safe and organized. Tell me more, or ask me about your medicines or appointments.`;
      }
    }

    const updated = [
      ...messages,
      { id: Date.now(), sender: "elder", text },
      { id: Date.now() + 1, sender: "ai", text: reply, offerSos, offerFamilyCall },
    ];
    setMessages(updated);
    setAiInput("");

    if (profile?.voice_enabled !== false) {
      speakText(
        reply,
        selectedLang === "Telugu" ? "te-IN" : "en-IN",
        profile?.voice_speed || 1
      );
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported on this device. You can type below.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = selectedLang === "Telugu" ? "te-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleSend(transcript);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="elder-subpage">
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={() => {
            stopSpeaking();
            navigate("/elder/dashboard");
          }}
        >
          <FaArrowLeft /> Back to Home
        </button>
        <div className="companion-page-title-row">
          <div>
            <h1>CareConnect AI Companion</h1>
            <p>Your caring, patient conversational friend available 24/7</p>
          </div>

          <div className="companion-lang-picker">
            <button
              type="button"
              className={`lang-tab ${selectedLang === "English" ? "active" : ""}`}
              onClick={() => setSelectedLang("English")}
            >
              English
            </button>
            <button
              type="button"
              className={`lang-tab ${selectedLang === "Telugu" ? "active" : ""}`}
              onClick={() => setSelectedLang("Telugu")}
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>

      <div className="elder-card companion-full-shell">
        {/* Giant Voice Center */}
        <div className="companion-voice-hero">
          <button
            type="button"
            className={`companion-giant-mic ${isListening ? "active-listening" : ""}`}
            onClick={startListening}
            aria-label="Tap to talk"
          >
            <FaMicrophone />
            <span>{isListening ? "Listening to you..." : "Tap to Talk"}</span>
          </button>
          <p className="companion-mic-hint">
            Tap the microphone and talk freely in{" "}
            <strong>{selectedLang === "Telugu" ? "Telugu" : "English"}</strong>
          </p>
        </div>

        {/* Message Stream */}
        <div className="companion-chat-stream">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-row ${msg.sender}`}>
              {msg.sender === "ai" && (
                <div className="chat-avatar-ai">
                  <FaRobot />
                </div>
              )}

              <div className={`chat-bubble-card ${msg.sender}`}>
                <p>{msg.text}</p>

                {msg.offerSos && (
                  <button
                    type="button"
                    className="bubble-action-btn sos-action"
                    onClick={onOpenSosModal}
                  >
                    <FaTriangleExclamation /> Activate Emergency Help Now
                  </button>
                )}

                {msg.offerFamilyCall && familyMembers.length > 0 && (
                  <button
                    type="button"
                    className="bubble-action-btn call-action"
                    onClick={async () => {
                      try {
                        await requestFamilyCall("Elder requested a phone call via AI Companion.");
                      } catch (e) {}
                      const phone =
                        familyMembers[0]?.family_phone || familyMembers[0]?.phone;
                      if (phone) {
                        window.location.href = `tel:${phone}`;
                      } else {
                        navigate("/elder/family");
                      }
                    }}
                  >
                    <FaPhone /> Call {familyMembers[0].family_name || "Family"}
                  </button>
                )}

                {msg.sender === "ai" && (
                  <button
                    type="button"
                    className="bubble-listen-btn"
                    onClick={() =>
                      speakText(
                        msg.text,
                        selectedLang === "Telugu" ? "te-IN" : "en-IN",
                        profile?.voice_speed || 1
                      )
                    }
                    title="Read message aloud"
                  >
                    <FaVolumeHigh /> Listen
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="companion-quick-chips">
          <button
            type="button"
            onClick={() =>
              handleSend(
                isTelugu
                  ? "నాకు ఈ రోజు ఏ మందులు ఉన్నాయి?"
                  : "What medicines should I take today?"
              )
            }
          >
            <FaPills /> What medicines do I have today?
          </button>
          <button
            type="button"
            onClick={() =>
              handleSend(
                isTelugu
                  ? "నా తదుపరి అపాయింట్‌మెంట్ ఎప్పుడు?"
                  : "When is my next appointment?"
              )
            }
          >
            <FaCalendarCheck /> When is my appointment?
          </button>
          <button
            type="button"
            onClick={() =>
              handleSend(
                isTelugu ? "నాకు ఒంటరిగా అనిపిస్తోంది." : "I am feeling lonely."
              )
            }
          >
            <FaHeart /> I am feeling lonely
          </button>
          <button
            type="button"
            onClick={() =>
              handleSend(
                isTelugu
                  ? "నేను నా కుటుంబ సభ్యులకు కాల్ చేయవచ్చా?"
                  : "Can I call my family?"
              )
            }
          >
            <FaPhone /> Call my family
          </button>
        </div>

        {/* Text Input Row */}
        <div className="companion-input-bar">
          <input
            type="text"
            className="companion-text-field"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder={
              isTelugu
                ? "మీ సందేశాన్ని ఇక్కడ టైప్ చేయండి..."
                : "Type your message or question here..."
            }
          />
          <button
            type="button"
            className="btn-companion-send"
            onClick={() => handleSend()}
          >
            <FaPaperPlane /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

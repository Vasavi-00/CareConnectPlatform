import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaRobot,
  FaXmark,
  FaPaperPlane,
  FaMicrophone,
  FaVolumeHigh,
  FaVolumeXmark,
  FaStop,
  FaTriangleExclamation,
  FaPhone,
  FaSpinner,
  FaWaveSquare,
} from "react-icons/fa6";
import { chatWithAI, voiceChatWithAI, requestFamilyCall } from "../../services/api/elderApi";
import { speakText, stopSpeaking } from "../../services/voice/speechSynthesis";
import { VoiceRecorder } from "../../services/voice/audioRecorder";
import "../../styles/elder/ElderChatbotWidget.css";

export default function ElderChatbotWidget({
  user,
  profile,
  medicines = [],
  appointments = [],
  onOpenSosModal,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [autoListen, setAutoListen] = useState(true);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [language, setLanguage] = useState(() => profile?.preferred_language || "English");
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [familyCallPending, setFamilyCallPending] = useState(false);
  const [familyCallSent, setFamilyCallSent] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const capturedSpeechRef = useRef("");
  const autoStopTimerRef = useRef(null);
  const hasSpokenWelcomeRef = useRef(false);

  if (!recorderRef.current) {
    recorderRef.current = new VoiceRecorder();
  }

  const isTelugu = language === "Telugu";
  const elderName = profile?.first_name || user?.first_name || (isTelugu ? "మిత్రమా" : "Friend");

  const initialGreeting = isTelugu
    ? `నమస్కారం ${elderName} గారు! నేను మీ కేర్‌కనెక్ట్ వాయిస్ కంపానియన్‌ని. ఈరోజు మీరు ఎలా ఉన్నారు? మీ మందులు, డాక్టర్ అపాయింట్‌మెంట్లు లేదా మీ ఆరోగ్యం గురించి నాతో మాట్లాడవచ్చు. ఈరోజు మీకు నేను ఎలా సహాయపడగలను?`
    : `Hello ${elderName}! I am your CareConnect voice companion. How are you feeling today? You can tell me about your medicines, upcoming doctor appointments, or just how your day is going. How can I help you right now?`;

  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: initialGreeting,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  // Keep language in sync if profile updates
  useEffect(() => {
    if (profile?.preferred_language && ["English", "Telugu"].includes(profile.preferred_language)) {
      setLanguage(profile.preferred_language);
    }
  }, [profile?.preferred_language]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isThinking, isOpen, liveTranscript]);

  // Cleanup speech recognition and audio recorder on unmount
  useEffect(() => {
    return () => {
      if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup error
        }
      }
      recorderRef.current?.cancel();
      stopSpeaking();
    };
  }, []);

  // Voice speech output function that transitions automatically to listening
  const speakVoiceResponse = useCallback(
    (textToSpeak, msgId, andThenListen = autoListen) => {
      if (voiceMuted || profile?.voice_enabled === false) {
        return;
      }

      // Interrupt any existing speech
      stopSpeaking();
      setIsAiSpeaking(true);
      setSpeakingMessageId(msgId);

      const langCode = isTelugu ? "te-IN" : "en-IN";
      const speed = Number(profile?.voice_speed) || 1;

      speakText(textToSpeak, langCode, speed, (state) => {
        if (state === "speaking") {
          setIsAiSpeaking(true);
          setSpeakingMessageId(msgId);
        } else if (
          state === "idle" ||
          state === "stopped" ||
          state === "error" ||
          state === "unsupported"
        ) {
          setIsAiSpeaking(false);
          setSpeakingMessageId(null);

          // If speech completed naturally and autoListen is enabled, listen to the elder's answer!
          if (state === "idle" && andThenListen) {
            setTimeout(() => {
              startVoiceListening();
            }, 350);
          }
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoListen, voiceMuted, profile, isTelugu]
  );

  // Speak initial welcoming question when opened
  useEffect(() => {
    if (isOpen) {
      if (!hasSpokenWelcomeRef.current) {
        hasSpokenWelcomeRef.current = true;
        // Small delay to allow modal render
        const timer = setTimeout(() => {
          speakVoiceResponse(initialGreeting, "welcome", autoListen);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // Stopped when widget is closed
      stopSpeaking();
      stopVoiceListening();
      setIsAiSpeaking(false);
      setSpeakingMessageId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startVoiceListening = async () => {
    if (isListening || isThinking) return;

    if (isAiSpeaking) {
      stopSpeaking();
      setIsAiSpeaking(false);
      setSpeakingMessageId(null);
    }

    setIsListening(true);
    setInput("");
    setLiveTranscript("");
    capturedSpeechRef.current = "";

    // 1. Browser Speech Recognition (Web Speech API) for real-time live typing
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = isTelugu ? "te-IN" : "en-IN";
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let interim = "";
          let final = "";
          for (let i = 0; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) final += t + " ";
            else interim += t;
          }
          const current = (final + interim).trim();
          capturedSpeechRef.current = current;
          setLiveTranscript(current);
          setInput(current);
        };

        recognition.onerror = (err) => {
          console.warn("Speech recognition error:", err);
        };

        recognition.start();
      } catch (recErr) {
        console.warn("SpeechRecognition start error:", recErr);
      }
    }

    // 2. Also start VoiceRecorder (MediaRecorder) in parallel as audio backup
    try {
      await recorderRef.current.start({
        maxDurationSec: 45,
        onMaxDuration: () => stopVoiceListening(),
      });
    } catch (mediaErr) {
      console.warn("MediaRecorder start error:", mediaErr);
      if (!recognitionRef.current) {
        setIsListening(false);
        alert(mediaErr?.message || "Could not access microphone.");
        return;
      }
    }

    // Auto-stop after 10 seconds if no speech detected
    if (autoStopTimerRef.current) clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = setTimeout(() => {
      stopVoiceListening();
    }, 10000);
  };

  const stopVoiceListening = async () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore error
      }
      recognitionRef.current = null;
    }

    let recorded = null;
    try {
      recorded = await recorderRef.current.stop();
    } catch (err) {
      console.warn("Audio stop error:", err);
    }

    const speechFromBrowser = (capturedSpeechRef.current || liveTranscript || input || "").trim();
    setLiveTranscript("");

    // Case 1: SpeechRecognition captured text from elder's voice
    if (speechFromBrowser) {
      handleSendMessage(speechFromBrowser);
      return;
    }

    // Case 2: Fallback to audio upload to Gemini on backend
    if (recorded && recorded.blob && recorded.sizeBytes > 100) {
      setIsThinking(true);
      try {
        const res = await voiceChatWithAI(recorded.blob, language, conversationId);
        if (res?.conversation_id) setConversationId(res.conversation_id);

        const transcribedText = (res?.transcription || "").trim();
        const replyText = (res?.reply || "").trim();

        if (transcribedText) {
          const userMsg = {
            id: `user-${Date.now()}`,
            sender: "user",
            text: transcribedText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          const aiMsg = {
            id: `ai-${Date.now() + 1}`,
            sender: "ai",
            text: replyText || (isTelugu ? "నేను మీ మాట వింటున్నాను." : "I am right here with you."),
            offerSos: Boolean(res?.offer_sos),
            offerFamilyCall: Boolean(res?.offer_family_call),
            familyCallReason: res?.family_call_reason,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          setMessages((prev) => [...prev, userMsg, aiMsg]);

          if (replyText) {
            speakVoiceResponse(replyText, aiMsg.id, autoListen);
          }
        } else {
          // Dead air / silence prompt
          const prompt = res?.reply || (isTelugu
            ? "మీ మాటలు స్పష్టంగా వినిపించలేదు. దయచేసి మైక్రోఫోన్ నొక్కి మళ్లీ మాట్లాడండి. నేను వింటున్నాను."
            : "I couldn't quite hear you. Please tap the microphone and speak again. I'm right here.");
          const aiMsg = {
            id: `ai-${Date.now() + 1}`,
            sender: "ai",
            text: prompt,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setMessages((prev) => [...prev, aiMsg]);
          speakVoiceResponse(prompt, aiMsg.id, autoListen);
        }
      } catch (voiceErr) {
        console.warn("Voice chat error:", voiceErr);
      } finally {
        setIsThinking(false);
      }
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || isThinking) return;

    setInput("");
    setLiveTranscript("");

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const res = await chatWithAI(query, language, conversationId);

      if (res?.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const reply = res?.reply || (isTelugu ? "నేను మీ మాట వింటున్నాను." : "I am right here with you.");
      const offerSos = Boolean(res?.offer_sos);
      const offerFamilyCall = Boolean(res?.offer_family_call);

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        offerSos,
        offerFamilyCall,
        familyCallReason: res?.family_call_reason,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Speak the AI response aloud and transition to listening for the elder's answer
      speakVoiceResponse(reply, aiMsg.id, autoListen);
    } catch (err) {
      console.warn("AI Companion API error, generating local fallback reply:", err);
      const lower = query.toLowerCase();
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
          reply = "ఇది అత్యవసర పరిస్థితి కావచ్చు. దయచేసి వెంటనే విశ్రాంతి తీసుకోండి. నేను మీకోసం ఎమర్జెన్సీ హెల్ప్ ప్రారంభించాలా?";
          offerSos = true;
        } else if (
          lower.includes("medicine") ||
          lower.includes("మందు") ||
          lower.includes("మాత్ర")
        ) {
          if (medicines.length > 0) {
            const medList = medicines.map((m) => `${m.name} (${m.dosage || "షెడ్యూల్ ప్రకారం"})`).join(", ");
            reply = `మీ మందుల వివరాలు: ${medList}. దయచేసి సమయానికి మాత్రమే తీసుకోండి. మీరు ఈరోజు మందులు వేసుకున్నారా?`;
          } else {
            reply = "మీ మందుల షెడ్యూల్ ప్రస్తుతానికి ఖాళీగా ఉంది. ఈరోజు మీ ఆరోగ్యం ఎలా అనిపిస్తోంది?";
          }
        } else if (
          lower.includes("appointment") ||
          lower.includes("doctor") ||
          lower.includes("డాక్టర్")
        ) {
          if (appointments.length > 0) {
            const nextAppt = appointments[0];
            reply = `మీ తదుపరి అపాయింట్‌మెంట్: ${nextAppt.doctor_name || "వైద్యుడు"}, ${nextAppt.clinic_name || "క్లినిక్"}. మీకు హాస్పిటల్‌కు వెళ్ళడానికి ఎవరైనా సహాయం కావాలా?`;
          } else {
            reply = "మీకు ప్రస్తుతం రాబోయే అపాయింట్‌మెంట్‌లు ఏవీ లేవు. మీ రోజు ఎలా గడుస్తోంది?";
          }
        } else if (
          lower.includes("lonely") ||
          lower.includes("sad") ||
          lower.includes("ఒంటరి") ||
          lower.includes("బాధ")
        ) {
          reply = "నేను ఎప్పుడూ మీతోనే ఉంటాను. మీ కుటుంబ సభ్యులతో మాట్లాడటానికి నేను వారికి కాల్ అభ్యర్థన పంపించమంటారా?";
          offerFamilyCall = true;
        } else {
          reply = "మీరు నాతో మాట్లాడినందుకు చాలా సంతోషం. ఈరోజు మీ శరీరం ఎలా ఉంది, కాస్త మంచి నీరు తాగారా?";
        }
      } else {
        if (
          lower.includes("fall") ||
          lower.includes("fell") ||
          lower.includes("chest") ||
          lower.includes("pain") ||
          lower.includes("breathe") ||
          lower.includes("hurt")
        ) {
          reply = "That sounds serious. Please rest immediately and do not exert yourself. Should I activate Emergency SOS for you right away?";
          offerSos = true;
        } else if (
          lower.includes("medicine") ||
          lower.includes("pill") ||
          lower.includes("dose")
        ) {
          if (medicines.length > 0) {
            const medList = medicines.map((m) => `${m.name} (${m.dosage || "scheduled dose"})`).join(", ");
            reply = `Here is your current medication list: ${medList}. Have you taken your dose for today?`;
          } else {
            reply = "You don't have any active medicines registered today. How are you feeling physically right now?";
          }
        } else if (
          lower.includes("appointment") ||
          lower.includes("doctor") ||
          lower.includes("clinic") ||
          lower.includes("visit")
        ) {
          if (appointments.length > 0) {
            const nextAppt = appointments[0];
            reply = `Your next appointment is with ${nextAppt.doctor_name || "your doctor"} at ${nextAppt.clinic_name || "the clinic"}. Do you need a ride or family member to go with you?`;
          } else {
            reply = "You have no doctor appointments scheduled today. How has your morning or afternoon been so far?";
          }
        } else if (
          lower.includes("lonely") ||
          lower.includes("alone") ||
          lower.includes("sad") ||
          lower.includes("bored") ||
          lower.includes("miss")
        ) {
          reply = "I'm right here with you, and you are never alone. Would you like me to request a phone call with your family member?";
          offerFamilyCall = true;
        } else {
          reply = "Thank you for sharing that with me. I'm listening closely. How is your energy today, and have you had your meal?";
        }
      }

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: reply,
        offerSos,
        offerFamilyCall,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakVoiceResponse(reply, aiMsg.id, autoListen);
    } finally {
      setIsThinking(false);
    }
  };

  const handleListenSpeech = (msg) => {
    if (speakingMessageId === msg.id) {
      stopSpeaking();
      setIsAiSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }
    speakVoiceResponse(msg.text, msg.id, false);
  };

  const handleVoiceListenToggle = () => {
    if (isListening) {
      stopVoiceListening();
    } else {
      startVoiceListening();
    }
  };

  const handleFamilyCallRequest = async (reason) => {
    setFamilyCallPending(true);
    try {
      await requestFamilyCall(
        reason ||
          (isTelugu
            ? "కంపానియన్ చాట్‌బాట్ ద్వారా కాల్ అభ్యర్థన"
            : "Elder requested a call via AI Companion voice chatbot")
      );
      setFamilyCallSent(true);
      const confirmMsg = {
        id: `sys-${Date.now()}`,
        sender: "ai",
        text: isTelugu
          ? "మీ కుటుంబ సభ్యులకు కాల్ అభ్యర్థన పంపబడింది. వారు త్వరలోనే మిమ్మల్ని సంప్రదిస్తారు."
          : "A call request has been sent to your family. They will be notified to call you soon.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
      speakVoiceResponse(confirmMsg.text, confirmMsg.id, false);
    } catch (err) {
      alert(err?.message || "Could not request family call. Please call them directly.");
    } finally {
      setFamilyCallPending(false);
    }
  };

  const chips = isTelugu
    ? [
        { label: "💊 నా మందులు ఏమిటి?", prompt: "నా ఈరోజు మందులు ఏమిటి?" },
        { label: "📅 తదుపరి అపాయింట్‌మెంట్", prompt: "నా తదుపరి డాక్టర్ అపాయింట్‌మెంట్ ఎప్పుడు?" },
        { label: "❤️ ఒంటరిగా అనిపిస్తోంది", prompt: "నాకు కొంచెం ఒంటరిగా అనిపిస్తోంది, నాతో మాట్లాడండి." },
        { label: "📞 కుటుంబానికి కాల్ చేయండి", prompt: "నా కుటుంబ సభ్యుడికి కాల్ చేయడంలో సహాయం చేయండి." },
      ]
    : [
        { label: "💊 Today's medicines", prompt: "What medicines do I have scheduled today?" },
        { label: "📅 Next appointment", prompt: "When is my next doctor appointment?" },
        { label: "❤️ I am feeling lonely", prompt: "I am feeling lonely today, can we talk?" },
        { label: "📞 Call family", prompt: "Please help me connect with my family." },
      ];

  return (
    <>
      {/* 1. FLOATING LAUNCHER BUTTON (Bottom Right Corner) */}
      <div className="elder-chatbot-launcher-container" id="elder-chatbot-launcher-anchor">
        <button
          type="button"
          className={`elder-chatbot-launcher-btn ${isOpen ? "active" : ""}`}
          onClick={() => {
            setIsOpen(!isOpen);
            if (isAiSpeaking || speakingMessageId) {
              stopSpeaking();
              setIsAiSpeaking(false);
              setSpeakingMessageId(null);
            }
          }}
          aria-label={isOpen ? "Close AI Companion voice chatbot" : "Open AI Companion voice chatbot"}
          aria-expanded={isOpen}
          title="Voice AI Care Companion"
        >
          {isOpen ? (
            <FaXmark className="launcher-icon close" />
          ) : (
            <div className="launcher-icon-wrapper">
              <FaRobot className="launcher-icon" />
              <span className="launcher-pulse-dot" />
            </div>
          )}
          <span className="launcher-tooltip">Voice AI Companion</span>
        </button>
      </div>

      {/* 2. FLOATING CHATBOT WINDOW (Bottom Right Corner) */}
      {isOpen && (
        <section
          className="elder-chatbot-window"
          role="dialog"
          aria-label="AI Voice Companion"
          aria-modal="false"
        >
          {/* Header */}
          <div className="elder-chatbot-header">
            <div className="chatbot-header-identity">
              <div className="chatbot-avatar-badge">
                <FaRobot />
                <span className="chatbot-online-dot" title="Online" />
              </div>
              <div className="chatbot-title-info">
                <h3 className="chatbot-title">Voice Companion</h3>
                <span className="chatbot-subtitle">
                  {isTelugu ? "వాయిస్ సంరక్షణ స్నేహితుడు • ఆన్‌లైన్" : "Spoken Care Friend • Online"}
                </span>
              </div>
            </div>

            <div className="chatbot-header-actions">
              <button
                type="button"
                className="chatbot-lang-toggle"
                onClick={() => {
                  const nextLang = isTelugu ? "English" : "Telugu";
                  setLanguage(nextLang);
                  const switchGreeting = nextLang === "Telugu"
                    ? `నమస్కారం ${elderName} గారు! నేను తెలుగులో మాట్లాడుతున్నాను. మీరు ఎలా ఉన్నారు?`
                    : `Hello ${elderName}! I am speaking in English. How are you feeling today?`;
                  speakVoiceResponse(switchGreeting, "switch-lang", autoListen);
                }}
                title="Change language"
              >
                {isTelugu ? "English" : "తెలుగు"}
              </button>

              <button
                type="button"
                className={`chatbot-lang-toggle ${voiceMuted ? "muted" : ""}`}
                onClick={() => {
                  const next = !voiceMuted;
                  setVoiceMuted(next);
                  if (next) {
                    stopSpeaking();
                    setIsAiSpeaking(false);
                    setSpeakingMessageId(null);
                  }
                }}
                title={voiceMuted ? "Unmute spoken replies" : "Mute spoken replies"}
                aria-label={voiceMuted ? "Unmute companion voice" : "Mute companion voice"}
              >
                {voiceMuted ? <FaVolumeXmark /> : <FaVolumeHigh />}
              </button>

              <button
                type="button"
                className="chatbot-close-btn"
                onClick={() => {
                  setIsOpen(false);
                  stopSpeaking();
                  stopVoiceListening();
                  setIsAiSpeaking(false);
                  setSpeakingMessageId(null);
                }}
                aria-label="Minimize chatbot"
              >
                <FaXmark />
              </button>
            </div>
          </div>

          {/* Interactive Spoken Conversation Status Bar */}
          <div
            className={`chatbot-voice-status-bar ${
              isAiSpeaking ? "speaking" : isListening ? "listening" : "idle"
            }`}
          >
            <div className="chatbot-voice-status-left">
              {isAiSpeaking ? (
                <>
                  <div className="chatbot-voice-wave" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <span>{isTelugu ? "కంపానియన్ మాట్లాడుతోంది..." : "Companion is speaking to you..."}</span>
                </>
              ) : isListening ? (
                <>
                  <span className="chatbot-pulse-mic" aria-hidden="true" />
                  <span>{isTelugu ? "మీ మాటలు వింటున్నాను... మాట్లాడండి" : "Listening to your voice... Speak now!"}</span>
                </>
              ) : (
                <>
                  <FaWaveSquare />
                  <span>{isTelugu ? "వాయిస్ సంభాషణ సిద్ధంగా ఉంది" : "Voice conversation active"}</span>
                </>
              )}
            </div>

            <div className="chatbot-voice-status-right">
              {isAiSpeaking ? (
                <button
                  type="button"
                  className="chatbot-voice-action-btn"
                  onClick={() => {
                    stopSpeaking();
                    setIsAiSpeaking(false);
                    setSpeakingMessageId(null);
                  }}
                  title="Stop speaking"
                >
                  <FaStop /> {isTelugu ? "ఆపు" : "Stop"}
                </button>
              ) : isListening ? (
                <button
                  type="button"
                  className="chatbot-voice-action-btn"
                  onClick={stopVoiceListening}
                  title="Finish speaking and send"
                >
                  <FaPaperPlane /> {isTelugu ? "పంపు" : "Done"}
                </button>
              ) : (
                <button
                  type="button"
                  className="chatbot-voice-action-btn"
                  onClick={() => setAutoListen(!autoListen)}
                  title="Toggle automatic voice conversation loop"
                >
                  {autoListen ? (isTelugu ? "ఆటో-విను: ఆన్" : "Auto-Listen: ON") : (isTelugu ? "ఆటో-విను: ఆఫ్" : "Auto-Listen: OFF")}
                </button>
              )}
            </div>
          </div>

          {/* Live Transcript Dock when Elder is speaking */}
          {isListening && (
            <div className="chatbot-listening-dock" role="status" aria-live="polite">
              <div className="chatbot-listening-header">
                <span className="chatbot-listening-badge">
                  <span className="chatbot-pulse-mic" aria-hidden="true" />
                  {isTelugu ? "మీ సమాధానాన్ని రికార్డ్ చేస్తోంది" : "Recording your answer..."}
                </span>
                <button
                  type="button"
                  className="chatbot-done-speaking-btn"
                  onClick={stopVoiceListening}
                >
                  {isTelugu ? "పూర్తయింది" : "I'm Done Speaking"}
                </button>
              </div>
              <p className="chatbot-listening-preview">
                {liveTranscript || (isTelugu ? "మీ మైక్రోఫోన్ ద్వారా మాట్లాడండి..." : "Speak into your microphone...")}
              </p>
            </div>
          )}

          {/* Quick Suggestion Chips */}
          <div className="chatbot-quick-chips" aria-label="Suggested questions">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="chatbot-chip-btn"
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isThinking}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="elder-chatbot-messages">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isSpeakingThis = speakingMessageId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`chatbot-msg-row ${isUser ? "user-row" : "ai-row"}`}
                >
                  {!isUser && (
                    <div className="chatbot-msg-avatar">
                      <FaRobot />
                    </div>
                  )}

                  <div className={`chatbot-msg-bubble ${isUser ? "user-bubble" : "ai-bubble"}`}>
                    <p className="chatbot-msg-text">{msg.text}</p>

                    <div className="chatbot-msg-meta">
                      <span className="chatbot-msg-time">{msg.time}</span>
                      {!isUser && (
                        <button
                          type="button"
                          className={`chatbot-listen-btn ${isSpeakingThis ? "speaking" : ""}`}
                          onClick={() => handleListenSpeech(msg)}
                          title={isSpeakingThis ? "Stop speaking" : "Hear voice again"}
                        >
                          {isSpeakingThis ? <FaStop /> : <FaVolumeHigh />}
                          <span>{isSpeakingThis ? (isTelugu ? "ఆపు" : "Stop") : (isTelugu ? "మళ్లీ వినండి" : "Hear Again")}</span>
                        </button>
                      )}
                    </div>

                    {/* SOS Action Button */}
                    {msg.offerSos && onOpenSosModal && (
                      <div className="chatbot-emergency-alert">
                        <button
                          type="button"
                          className="chatbot-sos-btn"
                          onClick={() => {
                            setIsOpen(false);
                            onOpenSosModal();
                          }}
                        >
                          <FaTriangleExclamation />
                          <span>{isTelugu ? "🚨 ఎమర్జెన్సీ SOS సహాయం" : "🚨 Activate Emergency SOS"}</span>
                        </button>
                      </div>
                    )}

                    {/* Family Call Action Button */}
                    {msg.offerFamilyCall && !familyCallSent && (
                      <div className="chatbot-call-alert">
                        <button
                          type="button"
                          className="chatbot-family-call-btn"
                          onClick={() => handleFamilyCallRequest(msg.familyCallReason)}
                          disabled={familyCallPending}
                        >
                          {familyCallPending ? <FaSpinner className="spin" /> : <FaPhone />}
                          <span>
                            {familyCallPending
                              ? (isTelugu ? "పంపుతోంది..." : "Sending...")
                              : (isTelugu ? "📞 కుటుంబానికి కాల్ చేయండి" : "📞 Request Family Call")}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="chatbot-msg-row ai-row">
                <div className="chatbot-msg-avatar">
                  <FaRobot />
                </div>
                <div className="chatbot-msg-bubble ai-bubble ai-thinking-bubble">
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-dot" />
                  <span className="ai-thinking-text">
                    {isTelugu ? "కంపానియన్ ఆలోచిస్తోంది..." : "Companion is thinking..."}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            className="elder-chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <button
              type="button"
              className={`chatbot-mic-btn ${isListening ? "listening" : ""}`}
              onClick={handleVoiceListenToggle}
              title={isListening ? "Listening... Tap to finish & send" : "Tap to speak your answer with microphone"}
              aria-label={isListening ? "Stop listening and send" : "Speak into microphone"}
            >
              {isListening ? <FaStop /> : <FaMicrophone />}
            </button>

            <input
              type="text"
              className="chatbot-input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isListening
                  ? (isTelugu ? "మీ మాటలు వింటున్నాను... ఆపడానికి నొక్కండి" : "Listening to you... Tap stop to send")
                  : (isTelugu ? "మైక్రోఫోన్ నొక్కండి లేదా ఇక్కడ టైప్ చేయండి..." : "Tap mic to speak or type here...")
              }
              disabled={isThinking}
            />

            <button
              type="submit"
              className="chatbot-send-btn"
              disabled={!input.trim() || isThinking}
              aria-label="Send message"
            >
              <FaPaperPlane />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

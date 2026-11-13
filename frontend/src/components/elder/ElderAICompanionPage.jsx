import React, { useState, useRef, useEffect } from "react";
import {
  FaArrowLeft,
  FaRobot,
  FaMicrophone,
  FaVolumeHigh,
  FaStop,
  FaRotateRight,
  FaPaperPlane,
  FaTriangleExclamation,
  FaPhone,
  FaHeart,
  FaPills,
  FaCalendarCheck,
  FaKeyboard,
  FaXmark,
  FaSpinner,
} from "react-icons/fa6";

import { speakText, stopSpeaking } from "../../services/voice/speechSynthesis";
import { VoiceRecorder } from "../../services/voice/audioRecorder";
import useSafeBack from "../../hooks/useSafeBack";
import {
  chatWithAI,
  voiceChatWithAI,
  getAIConversations,
  createAIConversation,
  requestFamilyCall,
  createConversationSummaryDraft,
  getAISummaries,
  shareAISummary,
  revokeAISummary,
} from "../../services/api/elderApi";

const CONV_STATES = {
  READY: "READY",
  LISTENING: "LISTENING",
  TRANSCRIBING: "TRANSCRIBING",
  THINKING: "THINKING",
  SPEAKING: "SPEAKING",
  ERROR: "ERROR",
};

export default function ElderAICompanionPage({
  profile,
  familyMembers = [],
  onOpenSosModal,
}) {
  const goBack = useSafeBack("/elder/dashboard");
  const chatBottomRef = useRef(null);
  const recorderRef = useRef(null);
  const sendLockRef = useRef(false);

  // Initialize VoiceRecorder lazily
  if (!recorderRef.current) {
    recorderRef.current = new VoiceRecorder();
  }

  const [convState, setConvState] = useState(CONV_STATES.READY);
  const [inputMode, setInputMode] = useState("voice"); // 'voice' | 'text'
  const [autoListen] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0);
  const [voiceError, setVoiceError] = useState("");
  const [lastSpokenReply, setLastSpokenReply] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const recognitionRef = useRef(null);
  const capturedSpeechRef = useRef("");

  const [aiInput, setAiInput] = useState("");
  const [voiceSpeed, setVoiceSpeed] = useState(() => {
    const saved = Number(localStorage.getItem("careconnect_companion_voice_speed"));
    return saved >= 0.7 && saved <= 1.3 ? saved : 1;
  });
  const [callRequestPending, setCallRequestPending] = useState(false);
  const [callRequestMessage, setCallRequestMessage] = useState("");
  const [selectedLang, setSelectedLang] = useState(
    profile?.preferred_language || "English"
  );

  const isTelugu = selectedLang === "Telugu";

  useEffect(() => {
    if (["English", "Telugu"].includes(profile?.preferred_language)) {
      setSelectedLang(profile.preferred_language);
    }
    if (Number(profile?.voice_speed) >= 0.7 && Number(profile?.voice_speed) <= 1.3) {
      setVoiceSpeed(Number(profile.voice_speed));
    }
  }, [profile?.preferred_language, profile?.voice_speed]);

  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [sendError, setSendError] = useState("");
  const [retryText, setRetryText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [aiSummaries, setAiSummaries] = useState([]);
  const [summaryDraft, setSummaryDraft] = useState(null);
  const [summaryText, setSummaryText] = useState("");
  const [summaryRecipients, setSummaryRecipients] = useState([]);
  const [summaryConsent, setSummaryConsent] = useState(false);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState("");

  // Load past conversation history on mount
  useEffect(() => {
    async function loadPastHistory() {
      try {
        const [convs, summaries] = await Promise.all([getAIConversations(), getAISummaries()]);
        setConversations(convs || []);
        setAiSummaries(summaries || []);
        const pendingDraft = (summaries || []).find(
          (item) => item.status === "DRAFT" && item.conversation_id === convs?.[0]?.id
        );
        if (pendingDraft) {
          setSummaryDraft(pendingDraft);
          setSummaryText(pendingDraft.summary);
          setSummaryRecipients((pendingDraft.recipients || []).map((item) => item.id));
        }
        if (convs && convs.length > 0 && convs[0].messages && convs[0].messages.length > 0) {
          setConversationId(convs[0].id);
          const loaded = convs[0].messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            text: m.content,
          }));
          setMessages(loaded);
          const lastAi = [...loaded].reverse().find((m) => m.sender === "ai");
          if (lastAi) setLastSpokenReply(lastAi.text);
        } else {
          const elderName = profile?.first_name || (isTelugu ? "మిత్రమా" : "Friend");
          const initialGreeting = isTelugu
            ? `నమస్కారం ${elderName} గారు! నేను మీ కేర్‌కనెక్ట్ వాయిస్ కంపానియన్‌ని. ఈరోజు మీరు ఎలా ఉన్నారు? మీ ఆరోగ్యం లేదా మందుల గురించి నాతో మాట్లాడవచ్చు. ఈరోజు మీకు నేను ఎలా సహాయపడగలను?`
            : `Hello ${elderName}! I am your CareConnect voice companion. How are you feeling today? You can tell me about your medicines, appointments, or anything on your mind. How can I help you right now?`;
          const welcomeMsg = { id: "welcome", sender: "ai", text: initialGreeting };
          setMessages([welcomeMsg]);
          setLastSpokenReply(initialGreeting);
          if (profile?.voice_enabled !== false) {
            setConvState(CONV_STATES.SPEAKING);
            speakText(initialGreeting, isTelugu ? "te-IN" : "en-IN", voiceSpeed, (state) => {
              if (state === "idle") {
                setConvState(CONV_STATES.READY);
                setTimeout(() => {
                  startVoiceRecording();
                }, 400);
              } else if (state === "stopped" || state === "error") {
                setConvState(CONV_STATES.READY);
              }
            });
          }
        }
      } catch {
        // default state
      }
    }
    loadPastHistory();
  }, []);

  // Cleanup on unmount: stop audio tracks and cancel any active speech
  useEffect(() => {
    return () => {
      recorderRef.current?.cancel();
      stopSpeaking();
    };
  }, []);

  // Scroll to bottom of chat stream
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, convState]);

  /* =========================================================================
     VOICE CONVERSATION FLOW (Elder speaks -> transcribed -> AI reply -> spoken)
  ========================================================================= */

  const startVoiceRecording = async () => {
    if (sendLockRef.current) return;

    // Interrupt AI if it is currently speaking
    if (convState === CONV_STATES.SPEAKING) {
      stopSpeaking();
    }

    setVoiceError("");
    setSendError("");
    setLiveTranscript("");
    capturedSpeechRef.current = "";

    setRecordingSeconds(0);
    setAudioVolume(0);
    setConvState(CONV_STATES.LISTENING);

    // 1. Browser Speech Recognition (Web Speech API) for real-time live transcription
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
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript + " ";
            } else {
              interim += transcript;
            }
          }
          const currentText = (final + interim).trim();
          capturedSpeechRef.current = currentText;
          setLiveTranscript(currentText);
        };

        recognition.onerror = (err) => {
          console.warn("SpeechRecognition error:", err);
        };

        recognition.start();
      } catch (recErr) {
        console.warn("SpeechRecognition start error:", recErr);
      }
    }

    // 2. Also start VoiceRecorder as audio backup
    try {
      await recorderRef.current.start({
        onVolume: (vol) => setAudioVolume(vol),
        onTime: (sec) => setRecordingSeconds(sec),
        maxDurationSec: 60,
        onMaxDuration: () => finishVoiceRecording(),
      });
    } catch (err) {
      if (!recognitionRef.current) {
        setConvState(CONV_STATES.ERROR);
        setVoiceError(err.message || "Could not access microphone.");
      }
    }
  };

  const finishVoiceRecording = async () => {
    if (convState !== CONV_STATES.LISTENING || sendLockRef.current) return;
    sendLockRef.current = true;

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
      console.warn("Audio recording stop failed:", err);
    }

    const recognizedText = (capturedSpeechRef.current || liveTranscript || "").trim();

    // 1. If live speech recognition captured text, send directly to Gemini!
    if (recognizedText) {
      setConvState(CONV_STATES.THINKING);
      const userMsg = { id: Date.now(), sender: "elder", text: recognizedText };
      setMessages((prev) => [...prev, userMsg]);
      setLiveTranscript("");

      try {
        const res = await chatWithAI(recognizedText, selectedLang, conversationId);
        if (res?.conversation_id) setConversationId(res.conversation_id);

        const replyText = (res?.reply || "").trim() || (isTelugu ? "నేను మీ మాట వింటున్నాను." : "I am right here with you.");
        const aiMsg = {
          id: Date.now() + 1,
          sender: "ai",
          text: replyText,
          offerSos: Boolean(res?.offer_sos),
          offerFamilyCall: Boolean(res?.offer_family_call),
          familyCallReason: res?.family_call_reason,
          aiMessageId: res?.ai_message_id,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setLastSpokenReply(replyText);
        setConvState(CONV_STATES.SPEAKING);

        if (profile?.voice_enabled !== false) {
          speakText(
            replyText,
            isTelugu ? "te-IN" : "en-IN",
            voiceSpeed,
            (state) => {
              if (state === "idle") {
                setConvState(CONV_STATES.READY);
                if (autoListen) {
                  setTimeout(() => {
                    startVoiceRecording();
                  }, 400);
                }
              } else if (state === "stopped" || state === "error") {
                setConvState(CONV_STATES.READY);
              }
            }
          );
        } else {
          setConvState(CONV_STATES.READY);
        }
        return;
      } catch (chatErr) {
        console.warn("Direct chat failed after recognition, attempting audio fallback:", chatErr);
      } finally {
        sendLockRef.current = false;
      }
    }

    // 2. Audio upload to backend (processed by Gemini audio transcription)
    if (!recorded || !recorded.blob || recorded.sizeBytes < 100) {
      sendLockRef.current = false;
      setConvState(CONV_STATES.READY);
      setVoiceError(
        isTelugu
          ? "ఆడియో రికార్డ్ కాలేదు. దయచేసి మైక్రోఫోన్ నొక్కి మాట్లాడండి."
          : "No speech was detected. Please tap the microphone and speak again."
      );
      return;
    }

    setConvState(CONV_STATES.TRANSCRIBING);

    try {
      const res = await voiceChatWithAI(recorded.blob, selectedLang, conversationId);
      if (res?.conversation_id) setConversationId(res.conversation_id);

      if (res?.clarification_needed) {
        const prompt =
          res.reply ||
          (isTelugu
            ? "మీరు మాట్లాడినది స్పష్టంగా వినిపించలేదు. దయచేసి మైక్రోఫోన్ నొక్కి మళ్లీ చెప్పండి."
            : "I couldn't quite hear that. Please tap the microphone and speak again.");
        setConvState(CONV_STATES.READY);
        setVoiceError(prompt);
        speakText(prompt, isTelugu ? "te-IN" : "en-IN", voiceSpeed);
        return;
      }

      const transcriptionText = (res.transcription || "").trim();
      const replyText = (res.reply || "").trim();

      if (!replyText) throw new Error("The AI Companion did not return a response.");

      const userMsg = { id: Date.now(), sender: "elder", text: transcriptionText };
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: replyText,
        offerSos: Boolean(res.offer_sos),
        offerFamilyCall: Boolean(res.offer_family_call),
        familyCallReason: res.family_call_reason,
        aiMessageId: res.ai_message_id,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setLastSpokenReply(replyText);
      setConvState(CONV_STATES.SPEAKING);

      if (profile?.voice_enabled !== false) {
        speakText(
          replyText,
          isTelugu ? "te-IN" : "en-IN",
          voiceSpeed,
          (state) => {
            if (state === "idle") {
              setConvState(CONV_STATES.READY);
              if (autoListen) {
                setTimeout(() => {
                  startVoiceRecording();
                }, 400);
              }
            } else if (state === "stopped" || state === "error") {
              setConvState(CONV_STATES.READY);
            }
          }
        );
      } else {
        setConvState(CONV_STATES.READY);
      }
    } catch (err) {
      setConvState(CONV_STATES.ERROR);
      setVoiceError(err.message || "Unable to send your voice message. Please try again.");
    } finally {
      sendLockRef.current = false;
      setLiveTranscript("");
    }
  };

  const cancelVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore error
      }
      recognitionRef.current = null;
    }
    recorderRef.current?.cancel();
    setRecordingSeconds(0);
    setAudioVolume(0);
    setLiveTranscript("");
    capturedSpeechRef.current = "";
    setConvState(CONV_STATES.READY);
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setConvState(CONV_STATES.READY);
  };

  const handleRepeatResponse = (textToRepeat = lastSpokenReply) => {
    const text = textToRepeat || lastSpokenReply;
    if (!text) return;
    setConvState(CONV_STATES.SPEAKING);
    speakText(
      text,
      isTelugu ? "te-IN" : "en-IN",
      voiceSpeed,
      (state) => {
        if (state === "idle" || state === "stopped" || state === "error") {
          setConvState(CONV_STATES.READY);
        }
      }
    );
  };

  /* =========================================================================
     TEXT CONVERSATION FLOW (Fallback for typing)
  ========================================================================= */

  const handleSendText = async (customText) => {
    const text = (customText || aiInput).trim();
    if (!text || sendLockRef.current) return;
    sendLockRef.current = true;
    setAiInput("");
    setSendError("");
    setRetryText("");
    setVoiceError("");

    if (convState === CONV_STATES.SPEAKING) stopSpeaking();
    setConvState(CONV_STATES.THINKING);

    const userMsg = { id: Date.now(), sender: "elder", text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await chatWithAI(text, selectedLang, conversationId);
      if (res?.conversation_id) setConversationId(res.conversation_id);
      const reply = res?.reply;
      if (!reply) throw new Error("The AI service did not return a reply.");

      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: reply,
        offerSos: Boolean(res?.offer_sos),
        offerFamilyCall: Boolean(res?.offer_family_call),
        familyCallReason: res?.family_call_reason,
        aiMessageId: res?.ai_message_id,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLastSpokenReply(reply);
      setConvState(CONV_STATES.SPEAKING);

      if (profile?.voice_enabled !== false) {
        speakText(
          reply,
          isTelugu ? "te-IN" : "en-IN",
          voiceSpeed,
          (state) => {
            if (state === "idle" || state === "stopped" || state === "error") {
              setConvState(CONV_STATES.READY);
            }
          }
        );
      } else {
        setConvState(CONV_STATES.READY);
      }
    } catch (error) {
      setMessages((prev) => prev.filter((item) => item.id !== userMsg.id));
      const errMsg = error?.message || "";
      if (errMsg.includes("token not valid") || errMsg.includes("Given token") || errMsg.includes("401")) {
        setSendError("Your session expired. Please click 'Retry sending' or refresh the page to continue.");
      } else {
        setSendError(error?.message || "The message could not be sent. Please try again.");
      }
      setRetryText(text);
      setConvState(CONV_STATES.READY);
    } finally {
      sendLockRef.current = false;
    }
  };

  /* =========================================================================
     FAMILY SUMMARY & CONVERSATION MANAGEMENT
  ========================================================================= */

  const prepareFamilySummary = async () => {
    if (!conversationId || summaryBusy) return;
    setSummaryBusy(true);
    setSummaryStatus("");
    try {
      const draft = await createConversationSummaryDraft(conversationId);
      setSummaryDraft(draft);
      setSummaryText(draft.summary || "");
      setSummaryRecipients((draft.recipients || []).map((item) => item.id));
      setSummaryConsent(false);
      setAiSummaries((previous) => [draft, ...previous.filter((item) => item.id !== draft.id)]);
      setSummaryStatus("Draft prepared for your review. It has not been shared.");
    } catch (err) {
      setSummaryStatus(err.message || "Could not prepare a summary. Your conversation remains private.");
    } finally {
      setSummaryBusy(false);
    }
  };

  const shareReviewedSummary = async () => {
    if (!summaryDraft || !summaryConsent || summaryRecipients.length === 0 || summaryBusy) return;
    setSummaryBusy(true);
    setSummaryStatus("");
    try {
      const shared = await shareAISummary(summaryDraft.id, {
        summary: summaryText,
        recipient_ids: summaryRecipients,
        consent: true,
      });
      setSummaryDraft(shared);
      setAiSummaries((previous) => [shared, ...previous.filter((item) => item.id !== shared.id)]);
      setSummaryConsent(false);
      setSummaryStatus(
        `Shared with ${shared.recipients?.length || summaryRecipients.length} selected family member(s). ${shared.notification_count} in-app alert(s) saved.`
      );
    } catch (err) {
      setSummaryStatus(err.message || "The summary was not shared. Please try again.");
    } finally {
      setSummaryBusy(false);
    }
  };

  const revokeReviewedSummary = async (summaryId) => {
    if (summaryBusy || !window.confirm("Revoke family access to this summary?")) return;
    setSummaryBusy(true);
    try {
      const revoked = await revokeAISummary(summaryId);
      setAiSummaries((previous) => previous.map((item) => (item.id === revoked.id ? revoked : item)));
      if (summaryDraft?.id === revoked.id) setSummaryDraft(revoked);
      setSummaryStatus("Family access to this summary has been revoked.");
    } catch (err) {
      setSummaryStatus(err.message || "Could not revoke this summary.");
    } finally {
      setSummaryBusy(false);
    }
  };

  const startNewConversation = async () => {
    try {
      stopSpeaking();
      recorderRef.current?.cancel();
      setConvState(CONV_STATES.READY);
      const created = await createAIConversation();
      setConversationId(created.id);
      setConversations((current) => [created, ...current]);
      setMessages([]);
      setLastSpokenReply("");
      setSummaryDraft(null);
      setSummaryText("");
      setSummaryRecipients([]);
      setSummaryConsent(false);
      setSummaryStatus("");
      setSendError("");
      setVoiceError("");
    } catch (error) {
      setSendError(error?.message || "Could not start a new conversation.");
    }
  };

  return (
    <div className="elder-subpage">
      {/* Header */}
      <div className="elder-subpage-header">
        <button
          type="button"
          className="elder-back-btn"
          onClick={() => {
            stopSpeaking();
            recorderRef.current?.cancel();
            goBack();
          }}
        >
          <FaArrowLeft /> Back to Home
        </button>
        <div className="companion-page-title-row">
          <div>
            <h1>CareConnect AI Companion</h1>
            <p>Speak naturally with your companion to check medicines, appointments, or talk about your day</p>
          </div>
          <button type="button" className="bubble-action-btn" onClick={startNewConversation}>
            New conversation
          </button>

          {/* Language Selector */}
          <div className="companion-lang-picker" role="radiogroup" aria-label="Select conversation language">
            <button
              type="button"
              className={`lang-tab ${selectedLang === "English" ? "active" : ""}`}
              onClick={() => setSelectedLang("English")}
              aria-checked={selectedLang === "English"}
              role="radio"
            >
              English
            </button>
            <button
              type="button"
              className={`lang-tab ${selectedLang === "Telugu" ? "active" : ""}`}
              onClick={() => setSelectedLang("Telugu")}
              aria-checked={selectedLang === "Telugu"}
              role="radio"
            >
              తెలుగు (Telugu)
            </button>
          </div>
        </div>
      </div>

      <div className="elder-card companion-full-shell">
        {/* =================================================================
            VOICE CONVERSATION HERO (Elder-Friendly Central Voice Interface)
        ================================================================= */}
        <section className="companion-voice-hero" aria-labelledby="companion-voice-title">
          <h2 id="companion-voice-title" className="sr-only">
            Voice Conversation Controls
          </h2>

          {/* Central Microphone / State Button */}
          <div className="companion-mic-center">
            <button
              type="button"
              className={`companion-giant-mic state-${convState.toLowerCase()} ${
                convState === CONV_STATES.LISTENING ? "active-listening" : ""
              }`}
              onClick={() => {
                if (convState === CONV_STATES.LISTENING) {
                  finishVoiceRecording();
                } else {
                  startVoiceRecording();
                }
              }}
              aria-label={
                convState === CONV_STATES.LISTENING
                  ? "Finish speaking and send message"
                  : convState === CONV_STATES.SPEAKING
                  ? "Interrupt companion and speak"
                  : "Tap to speak with your CareConnect companion"
              }
              aria-pressed={convState === CONV_STATES.LISTENING}
            >
              {convState === CONV_STATES.LISTENING ? (
                <FaMicrophone className="mic-icon pulse" />
              ) : convState === CONV_STATES.TRANSCRIBING || convState === CONV_STATES.THINKING ? (
                <FaSpinner className="mic-icon spin" />
              ) : convState === CONV_STATES.SPEAKING ? (
                <FaVolumeHigh className="mic-icon sound-wave" />
              ) : convState === CONV_STATES.ERROR ? (
                <FaRotateRight className="mic-icon" />
              ) : (
                <FaMicrophone className="mic-icon" />
              )}
              <span className="mic-caption">
                {convState === CONV_STATES.READY && (isTelugu ? "నొక్కండి & మాట్లాడండి" : "Tap and Speak")}
                {convState === CONV_STATES.LISTENING && (isTelugu ? "ముగింపు నొక్కండి" : "Tap when Done")}
                {convState === CONV_STATES.TRANSCRIBING && (isTelugu ? "వాయిస్ ప్రాసెస్ అవుతోంది..." : "Transcribing…")}
                {convState === CONV_STATES.THINKING && (isTelugu ? "ఆలోచిస్తోంది..." : "Thinking…")}
                {convState === CONV_STATES.SPEAKING && (isTelugu ? "మాట్లాడుతోంది (ఆపడానికి నొక్కండి)" : "Speaking (Tap to interrupt)")}
                {convState === CONV_STATES.ERROR && (isTelugu ? "మళ్లీ ప్రయత్నించండి" : "Try Again")}
              </span>
            </button>
          </div>

          {/* Visual State & Soundwave Feedback */}
          {convState === CONV_STATES.LISTENING && (
            <div className="companion-listening-bar" role="status" aria-live="polite">
              <span className="rec-indicator" />
              <strong>{isTelugu ? "వింటోంది..." : "Listening… speak naturally"}</strong>
              <span className="rec-timer">
                {Math.floor(recordingSeconds / 60)}:
                {String(recordingSeconds % 60).padStart(2, "0")} / 1:00
              </span>
              <div className="soundwave-bars" aria-hidden="true">
                {[0.3, 0.7, 1.0, 0.6, 0.8, 0.4].map((scale, i) => (
                  <span
                    key={i}
                    className="wave-bar"
                    style={{
                      height: `${Math.max(8, (audioVolume * 36 + 6) * scale)}px`,
                    }}
                  />
                ))}
              </div>
              <button
                type="button"
                className="btn-cancel-recording"
                onClick={cancelVoiceRecording}
                aria-label="Cancel recording"
              >
                <FaXmark /> Cancel
              </button>
            </div>
          )}

          {/* Real-time live speech preview (Elder sees their words as they speak!) */}
          {convState === CONV_STATES.LISTENING && liveTranscript && (
            <div className="companion-live-transcript-box" role="status" aria-live="polite">
              <span className="live-transcript-label">{isTelugu ? "వినిపిస్తున్నది:" : "Hearing you:"}</span>
              <p className="live-transcript-text">"{liveTranscript}"</p>
            </div>
          )}

          {/* Processing Indicator */}
          {(convState === CONV_STATES.TRANSCRIBING || convState === CONV_STATES.THINKING) && (
            <p className="companion-voice-status processing" role="status" aria-live="polite">
              <FaSpinner className="spin-inline" />{" "}
              {convState === CONV_STATES.TRANSCRIBING
                ? isTelugu
                  ? "మీ స్వరాన్ని గుర్తిస్తోంది..."
                  : "Transcribing your spoken message…"
                : isTelugu
                ? "కంపానియన్ సమాధానం సిద్ధం చేస్తోంది..."
                : "Your CareConnect companion is thinking…"}
            </p>
          )}

          {/* Speaking Controls */}
          {convState === CONV_STATES.SPEAKING && (
            <div className="companion-speaking-controls" role="status" aria-live="polite">
              <span className="speaking-badge">
                <FaVolumeHigh /> {isTelugu ? "సమాధానం వింటున్నారు..." : "Speaking response aloud..."}
              </span>
              <button
                type="button"
                className="bubble-action-btn stop-speaking-btn"
                onClick={handleStopSpeaking}
              >
                <FaStop /> Stop speaking
              </button>
              <button
                type="button"
                className="bubble-action-btn repeat-speech-btn"
                onClick={() => handleRepeatResponse()}
              >
                <FaRotateRight /> Repeat response
              </button>
            </div>
          )}

          {/* Repeat button available when idle and a previous reply exists */}
          {convState === CONV_STATES.READY && lastSpokenReply && (
            <div className="companion-replay-row">
              <button
                type="button"
                className="btn-replay-last"
                onClick={() => handleRepeatResponse()}
                title="Hear the last response again"
              >
                <FaRotateRight /> Hear last response again
              </button>
            </div>
          )}

          {/* Error Banner with Retry */}
          {voiceError && (
            <div className="companion-error-banner" role="alert">
              <FaTriangleExclamation />
              <div>
                <strong>{voiceError}</strong>
                <p>
                  {isTelugu
                    ? "మీరు మైక్రోఫోన్ నొక్కవచ్చు లేదా కింద టైప్ చేయవచ్చు."
                    : "You can tap the microphone to try again or switch to typing below."}
                </p>
              </div>
              <button
                type="button"
                className="btn-retry-voice"
                onClick={() => {
                  setVoiceError("");
                  setConvState(CONV_STATES.READY);
                }}
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Speech Rate & Mode Selector */}
          <div className="companion-toolbar-row">
            <label className="companion-speed-control">
              Voice speed: {voiceSpeed.toFixed(1)}x
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.1"
                value={voiceSpeed}
                aria-label="Voice playback speed"
                onChange={(event) => {
                  const speed = Number(event.target.value);
                  setVoiceSpeed(speed);
                  localStorage.setItem("careconnect_companion_voice_speed", String(speed));
                }}
              />
            </label>

            <button
              type="button"
              className="btn-mode-toggle"
              onClick={() => setInputMode((prev) => (prev === "voice" ? "text" : "voice"))}
            >
              {inputMode === "voice" ? (
                <>
                  <FaKeyboard /> Switch to typing
                </>
              ) : (
                <>
                  <FaMicrophone /> Switch to voice mode
                </>
              )}
            </button>
          </div>
        </section>

        {/* =================================================================
            TRANSCRIPT STREAM (Readable messages between elder and AI)
        ================================================================= */}
        <section className="companion-chat-stream-section" aria-label="Conversation history">
          <div className="companion-chat-stream">
            {messages.length === 0 && (
              <div className="companion-welcome-card">
                <div className="welcome-avatar">
                  <FaRobot />
                </div>
                <h3>
                  {isTelugu
                    ? "నమస్కారం! నేను మీ కేర్‌కనెక్ట్ కంపానియన్."
                    : "Hello! I am your CareConnect Companion."}
                </h3>
                <p>
                  {isTelugu
                    ? "మైక్రోఫోన్ బటన్ నొక్కి మాట్లాడండి. మీరు మీ మందులు, అపాయింట్‌మెంట్‌లు లేదా ఏ విషయమైనా అడగవచ్చు."
                    : "Tap the microphone above and speak. You can ask about your medicines, doctor visits, or simply talk about how your day is going."}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-row ${msg.sender}`}>
                {msg.sender === "ai" && (
                  <div className="chat-avatar-ai" aria-hidden="true">
                    <FaRobot />
                  </div>
                )}

                <div className={`chat-bubble-card ${msg.sender}`}>
                  <p>{msg.text}</p>

                  {/* Contextual Action: SOS Offer */}
                  {msg.offerSos && (
                    <button
                      type="button"
                      className="bubble-action-btn sos-action"
                      onClick={onOpenSosModal}
                    >
                      <FaTriangleExclamation /> Activate Emergency Help Now
                    </button>
                  )}

                  {/* Contextual Action: Family Call Request */}
                  {msg.offerFamilyCall && familyMembers.length > 0 && (
                    <button
                      type="button"
                      className="bubble-action-btn call-action"
                      disabled={callRequestPending}
                      onClick={async () => {
                        if (callRequestPending) return;
                        setCallRequestPending(true);
                        setCallRequestMessage("");
                        try {
                          const result = await requestFamilyCall(
                            msg.familyCallReason || "Requested a call via AI Companion."
                          );
                          setCallRequestMessage(
                            result.sent
                              ? `Your call request was saved and an in-app alert was created for ${result.notified_count} connected family member(s).`
                              : "Your call request was saved, but no in-app alert could be created. Please use My Family to contact someone."
                          );
                        } catch (error) {
                          setCallRequestMessage(
                            error?.message || "We could not send the call request. Please try again."
                          );
                        } finally {
                          setCallRequestPending(false);
                        }
                      }}
                    >
                      <FaPhone /> {callRequestPending ? "Sending request..." : "Ask my family to call"}
                    </button>
                  )}

                  {msg.offerFamilyCall && callRequestMessage && (
                    <p role="status" className="companion-action-status">
                      {callRequestMessage}
                    </p>
                  )}

                  {/* Hear Message Button */}
                  {msg.sender === "ai" && (
                    <button
                      type="button"
                      className="bubble-listen-btn"
                      onClick={() => handleRepeatResponse(msg.text)}
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
        </section>

        {/* Quick Conversation Starters */}
        <div className="companion-quick-chips" aria-label="Suggested questions">
          <button
            type="button"
            onClick={() =>
              handleSendText(
                isTelugu
                  ? "నాకు ఈ రోజు ఏ మందులు ఉన్నాయి?"
                  : "What medicines should I take today?"
              )
            }
          >
            <FaPills /> {isTelugu ? "నా మందులు ఏమిటి?" : "What medicines do I have today?"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleSendText(
                isTelugu
                  ? "నా తదుపరి అపాయింట్‌మెంట్ ఎప్పుడు?"
                  : "When is my next appointment?"
              )
            }
          >
            <FaCalendarCheck /> {isTelugu ? "నా అపాయింట్‌మెంట్ ఎప్పుడు?" : "When is my appointment?"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleSendText(
                isTelugu ? "నాకు ఒంటరిగా అనిపిస్తోంది." : "I am feeling lonely."
              )
            }
          >
            <FaHeart /> {isTelugu ? "నాకు ఒంటరిగా అనిపిస్తోంది" : "I am feeling lonely"}
          </button>
          <button
            type="button"
            onClick={() =>
              handleSendText(
                isTelugu
                  ? "నేను నా కుటుంబ సభ్యులకు కాల్ చేయవచ్చా?"
                  : "Can I call my family?"
              )
            }
          >
            <FaPhone /> {isTelugu ? "కుటుంబానికి కాల్ చేయండి" : "Call my family"}
          </button>
        </div>

        {/* Text Input Option (Available when text mode is chosen or needed) */}
        {inputMode === "text" && (
          <div className="companion-input-bar">
            <input
              type="text"
              className="companion-text-field"
              aria-label="Type your message to the CareConnect Companion"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendText();
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
              disabled={convState === CONV_STATES.THINKING}
              onClick={() => handleSendText()}
            >
              <FaPaperPlane /> {convState === CONV_STATES.THINKING ? "Sending…" : "Send"}
            </button>
          </div>
        )}

        {/* =================================================================
            FAMILY SUMMARY PANEL (Consent-based summary sharing)
        ================================================================= */}
        <section className="companion-summary-panel" aria-labelledby="companion-summary-title">
          <h2 id="companion-summary-title">Share a practical update with family</h2>
          <p>
            Your conversations are private. CareConnect can prepare a short draft; review and edit it before
            choosing who can see it. Emotional or sensitive details are excluded from the draft.
          </p>
          <button
            type="button"
            className="bubble-action-btn"
            onClick={prepareFamilySummary}
            disabled={
              !conversationId ||
              convState === CONV_STATES.THINKING ||
              summaryBusy ||
              summaryDraft?.status === "DRAFT"
            }
          >
            {summaryBusy
              ? "Preparing…"
              : summaryDraft?.status === "DRAFT"
              ? "Draft ready below"
              : "Prepare summary to review"}
          </button>
          {summaryDraft?.status === "DRAFT" && (
            <div className="companion-summary-review">
              <label htmlFor="summary-preview">Review and edit this private draft</label>
              <textarea
                id="summary-preview"
                rows={4}
                maxLength={1200}
                value={summaryText}
                onChange={(event) => setSummaryText(event.target.value)}
              />
              <fieldset>
                <legend>Choose who may see this update</legend>
                {familyMembers
                  .filter((member) => member.family)
                  .map((member) => (
                    <label key={member.family}>
                      <input
                        type="checkbox"
                        checked={summaryRecipients.includes(member.family)}
                        onChange={(event) =>
                          setSummaryRecipients((current) =>
                            event.target.checked
                              ? [...current, member.family]
                              : current.filter((id) => id !== member.family)
                          )
                        }
                      />
                      {member.family_name || "Connected family member"}
                    </label>
                  ))}
                {familyMembers.length === 0 && <p>No connected family members are available to select.</p>}
              </fieldset>
              <label className="companion-summary-consent">
                <input
                  type="checkbox"
                  checked={summaryConsent}
                  onChange={(event) => setSummaryConsent(event.target.checked)}
                />
                I reviewed this exact text and want to share it with only the selected people. The full
                conversation stays private.
              </label>
              <button
                type="button"
                className="bubble-action-btn call-action"
                disabled={summaryBusy || !summaryConsent || summaryRecipients.length === 0 || !summaryText.trim()}
                onClick={shareReviewedSummary}
              >
                {summaryBusy ? "Sharing…" : "Share reviewed summary"}
              </button>
            </div>
          )}
          {summaryStatus && (
            <p role="status" className="companion-action-status">
              {summaryStatus}
            </p>
          )}
          {aiSummaries
            .filter((item) => item.status === "SHARED")
            .slice(0, 5)
            .map((item) => (
              <article className="companion-shared-summary" key={item.id}>
                <strong>Shared {item.shared_at ? new Date(item.shared_at).toLocaleString() : ""}</strong>
                <p>{item.summary}</p>
                <small>
                  Shared with{" "}
                  {(item.recipients || []).map((recipient) => recipient.name).join(", ") ||
                    "selected family"}
                  .
                </small>
                <button
                  type="button"
                  className="bubble-action-btn"
                  disabled={summaryBusy}
                  onClick={() => revokeReviewedSummary(item.id)}
                >
                  Revoke access
                </button>
              </article>
            ))}
        </section>

        {/* Previous conversation picker */}
        {conversations.length > 1 && (
          <label className="companion-history-picker">
            Previous conversation
            <select
              aria-label="Choose a previous conversation"
              value={conversationId || ""}
              onChange={(event) => {
                const selected = conversations.find((item) => String(item.id) === event.target.value);
                if (selected) {
                  setConversationId(selected.id);
                  setMessages(
                    (selected.messages || []).map((m) => ({
                      id: m.id,
                      sender: m.sender,
                      text: m.content,
                    }))
                  );
                  setSummaryDraft(null);
                  setSummaryText("");
                  setSummaryRecipients([]);
                  setSummaryConsent(false);
                }
              }}
            >
              {conversations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title || "Conversation"}
                </option>
              ))}
            </select>
          </label>
        )}

        {sendError && (
          <div className="companion-error" role="alert">
            <p>{sendError}</p>
            {retryText && (
              <button
                type="button"
                disabled={convState === CONV_STATES.THINKING}
                onClick={() => handleSendText(retryText)}
              >
                Retry sending
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

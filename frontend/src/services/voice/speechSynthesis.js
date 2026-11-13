const SETTINGS_KEY = "careconnect_voice_notification_settings";
const SPOKEN_KEY = "careconnect_spoken_notification_ids";
const MAX_SPOKEN_IDS = 100;

let queue = [];
let active = null;
let queuedKeys = new Set();
let lastSpoken = null;
let order = 0;

function reportSpeechState(item, state) {
  item.onState?.(state);
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("careconnect-speech-status", {
        detail: { state, kind: item.kind || "speech" },
      }));
    } catch {
      // Status announcements are optional; speech itself should keep working.
    }
  }
}

function speechApi() {
  if (typeof window === "undefined" || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") return null;
  return window.speechSynthesis;
}

export function getVoiceNotificationSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    return {
      enabled: saved.enabled === true,
      medicinesEnabled: saved.medicinesEnabled !== false,
      appointmentsEnabled: saved.appointmentsEnabled !== false,
      readDetails: saved.readDetails === true,
      voiceName: typeof saved.voiceName === "string" ? saved.voiceName : "",
    };
  } catch {
    return { enabled: false, medicinesEnabled: true, appointmentsEnabled: true, readDetails: false, voiceName: "" };
  }
}

export function saveVoiceNotificationSettings(settings) {
  const previous = getVoiceNotificationSettings();
  const next = {
    enabled: typeof settings.enabled === "boolean" ? settings.enabled : previous.enabled,
    medicinesEnabled: typeof settings.medicinesEnabled === "boolean" ? settings.medicinesEnabled : previous.medicinesEnabled,
    appointmentsEnabled: typeof settings.appointmentsEnabled === "boolean" ? settings.appointmentsEnabled : previous.appointmentsEnabled,
    readDetails: typeof settings.readDetails === "boolean" ? settings.readDetails : previous.readDetails,
    voiceName: typeof settings.voiceName === "string" ? settings.voiceName : previous.voiceName,
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    localStorage.setItem("careconnect_voice_medicine_reminders", (next.enabled && next.medicinesEnabled) ? "enabled" : "disabled");
    localStorage.setItem("careconnect_voice_appointment_reminders", (next.enabled && next.appointmentsEnabled) ? "enabled" : "disabled");
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("careconnect-voice-settings", { detail: next }));
  } catch {
    // Settings still apply in this page session if storage is unavailable.
  }
  return next;
}

export function getSpeechVoices(language) {
  const api = speechApi();
  if (!api) return [];
  const voices = api.getVoices();
  if (!language) return voices;
  const prefix = language.toLowerCase().slice(0, 2);
  return voices.filter((voice) => voice.lang?.toLowerCase().startsWith(prefix));
}

export function isSpeechSupported() {
  return Boolean(speechApi());
}

export function isSpeaking() {
  const api = speechApi();
  return Boolean(api && (api.speaking || active));
}

export function isPaused() {
  const api = speechApi();
  return Boolean(api && api.paused);
}

function alreadySpoken(key) {
  if (!key) return false;
  try {
    return JSON.parse(localStorage.getItem(SPOKEN_KEY) || "[]").includes(String(key));
  } catch {
    return false;
  }
}

export function hasSpokenNotification(key) {
  if (!key) return false;
  return alreadySpoken(key) || queuedKeys.has(String(key));
}

export function clearSpokenHistory() {
  try {
    localStorage.removeItem(SPOKEN_KEY);
  } catch {
    // optional storage cleanup
  }
  queuedKeys.clear();
}

function rememberSpoken(key) {
  if (!key) return;
  try {
    const ids = JSON.parse(localStorage.getItem(SPOKEN_KEY) || "[]");
    localStorage.setItem(SPOKEN_KEY, JSON.stringify([...ids.filter((id) => id !== String(key)), String(key)].slice(-MAX_SPOKEN_IDS)));
  } catch {
    // The in-memory queue still prevents duplicates during this page session.
  }
}

function pumpQueue() {
  const api = speechApi();
  if (!api || active || queue.length === 0) return;
  queue.sort((a, b) => b.priority - a.priority || a.order - b.order);
  const item = queue.shift();
  active = item;
  reportSpeechState(item, "processing");

  let utterance;
  try {
    utterance = new window.SpeechSynthesisUtterance(item.text);
    utterance.lang = item.language;
    utterance.rate = Math.min(1.3, Math.max(0.7, Number(item.rate) || 1));
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = api.getVoices();
    const languageVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith(item.language.toLowerCase().slice(0, 2)));
    if (voices.length > 0 && !languageVoice) {
      finishItem(item, "unsupported");
      return;
    }
    utterance.voice = (item.voiceName && voices.find((voice) => voice.name === item.voiceName))
      || languageVoice
      || null;
    utterance.onstart = () => {
      item.started = true;
      reportSpeechState(item, "speaking");
      if (item.dedupeKey) rememberSpoken(item.dedupeKey);
      if (item.rememberAsLast !== false) lastSpoken = { ...item };
    };
    utterance.onend = () => finishItem(item, "idle");
    utterance.onerror = () => finishItem(item, "error");
    api.speak(utterance);
  } catch {
    finishItem(item, "error");
  }
}

function finishItem(item, state) {
  if (active !== item) return;
  reportSpeechState(item, state);
  if (item.dedupeKey) queuedKeys.delete(String(item.dedupeKey));
  active = null;
  pumpQueue();
}

function enqueue(text, language, rate, onState, options = {}) {
  if (typeof text !== "string" || !text.trim()) return false;
  if (!speechApi()) {
    onState?.("unsupported");
    if (typeof window !== "undefined") {
      try { window.dispatchEvent(new CustomEvent("careconnect-speech-status", { detail: { state: "unsupported", kind: options.kind || "speech" } })); } catch { /* optional status event */ }
    }
    return false;
  }
  const dedupeKey = options.dedupeKey ? String(options.dedupeKey) : "";
  if (dedupeKey && (alreadySpoken(dedupeKey) || queuedKeys.has(dedupeKey))) return false;

  const priority = Number(options.priority) || 0;
  const item = {
    text: text.trim(), language, rate, onState, dedupeKey,
    voiceName: options.voiceName || "",
    kind: options.kind || "speech",
    priority,
    order: order++, rememberAsLast: options.rememberAsLast,
  };

  // If explicit preemption requested or SOS priority >= 100 with preempt option
  if (options.preempt && active && (active.priority || 0) < priority) {
    const api = speechApi();
    const interrupted = active;
    active = null;
    reportSpeechState(interrupted, "interrupted");
    try {
      api?.cancel();
    } catch {
      // ignore cancel error
    }
  }

  if (dedupeKey) queuedKeys.add(dedupeKey);
  queue.push(item);
  pumpQueue();
  return true;
}

// Interactive reads use the same serialized queue as background notifications.
export function speakText(text, language = "en-IN", rate = 1, onState, options = {}) {
  return enqueue(text, language, rate, onState, { ...options, priority: options.priority ?? 50, rememberAsLast: options.rememberAsLast ?? false });
}

export function queueSpeech(text, language = "en-IN", rate = 1, options = {}) {
  return enqueue(text, language, rate, options.onState, options);
}

export function preemptSpeech(text, language = "en-IN", rate = 1, onState, options = {}) {
  return enqueue(text, language, rate, onState, { ...options, priority: options.priority ?? 100, preempt: true });
}

export function stopSpeaking() {
  const api = speechApi();
  queue.forEach((item) => {
    reportSpeechState(item, "stopped");
    if (item.dedupeKey) queuedKeys.delete(item.dedupeKey);
  });
  queue = [];
  if (active) {
    const item = active;
    active = null;
    if (item.dedupeKey) queuedKeys.delete(item.dedupeKey);
    reportSpeechState(item, "stopped");
  }
  api?.cancel();
}

export function pauseSpeaking() {
  const api = speechApi();
  if (api?.speaking && !api.paused) api.pause();
}

export function resumeSpeaking() {
  const api = speechApi();
  if (api?.paused) api.resume();
}

export function replayLastSpeech() {
  if (!lastSpoken) return false;
  const { text, language, rate, voiceName } = lastSpoken;
  return speakText(text, language, rate, undefined, { voiceName });
}

export function notificationAnnouncementText(notification, language = "English", readDetails = false, relatedRecord = null) {
  const telugu = language === "Telugu";
  const type = notification?.notification_type;
  const title = notification?.title || "";
  const message = notification?.message || "";
  const content = `${title} ${message}`.toLowerCase();

  if (type === "MEDICINE") {
    if (readDetails) return `${title || "Medicine reminder"}. ${message}`.trim();
    return telugu ? "మీ షెడ్యూల్ చేసిన మందుల రిమైండర్ సమయం అయింది." : "It's time for your scheduled medicine reminder.";
  }
  if (type === "APPOINTMENT") {
    if (readDetails && relatedRecord?.appointment_at) {
      const locale = telugu ? "te-IN" : "en-IN";
      const when = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(relatedRecord.appointment_at));
      if (telugu) return `మీకు ${relatedRecord.doctor_name || "వైద్యుడు"}, ${relatedRecord.clinic_name || "క్లినిక్"} వద్ద ${when} అపాయింట్‌మెంట్ ఉంది. ${relatedRecord.location ? `చిరునామా: ${relatedRecord.location}.` : ""}`.trim();
      return `You have an appointment with ${relatedRecord.doctor_name || "your doctor"} at ${relatedRecord.clinic_name || "your clinic"} on ${when}. ${relatedRecord.location ? `Address: ${relatedRecord.location}.` : ""}`.trim();
    }
    if (readDetails) return `${title || "Appointment update"}. ${message}`.trim();
    const isCancelled = content.includes("cancelled") || content.includes("canceled");
    if (isCancelled) {
      return telugu ? "మీ అపాయింట్‌మెంట్‌లలో ఒక ప్రైవేట్ అప్‌డేట్ ఉంది. స్థితి మారింది, వివరాలు చూడటానికి అపాయింట్‌మెంట్‌లను తెరవండి." : "You have a private update: your appointment status has changed. Please open your appointments to hear the details.";
    }
    return telugu ? "మీ అపాయింట్‌మెంట్‌లలో ఒక ప్రైవేట్ అప్‌డేట్ ఉంది. వివరాలు వినడానికి అపాయింట్‌మెంట్‌లను తెరవండి." : "You have a private update: you have a doctor's appointment coming up. Please open your appointments to hear the details.";
  }
  if (type === "AI_SUMMARY") {
    const isFamily = content.includes("family") || content.includes("కుటుంబ") || content.includes("call request");
    if (isFamily) {
      return telugu ? "మీకు కొత్త కుటుంబ అప్‌డేట్ వచ్చింది. వివరాలు వినాలనుకుంటున్నారా?" : "You have a new family update. Would you like me to read it aloud?";
    }
    return telugu ? "మీ కేర్‌కనెక్ట్ కంపానియన్ నుండి కొత్త అప్‌డేట్ ఉంది." : "You have a new update from your CareConnect companion.";
  }
  if (type === "SOS") {
    return telugu ? "మీ అత్యవసర అభ్యర్థన స్థితిలో మార్పు ఉంది. దయచేసి అత్యవసర సమాచారాన్ని తనిఖీ చేయండి." : "Your emergency request status has changed. Please check the emergency information.";
  }
  if (type === "SYSTEM") {
    if (readDetails && title) return `${title}. ${message}`.trim();
    return telugu ? "మీ కేర్‌కనెక్ట్ ఖాతాలో కొత్త ప్రకటన ఉంది." : "There is a new CareConnect announcement in your notifications.";
  }
  if (readDetails && title) return `${title}. ${message}`.trim();
  return telugu ? "మీ సంరక్షణ డ్యాష్‌బోర్డ్‌లో కొత్త నోటిఫికేషన్ ఉంది." : "You have a new notification in your care dashboard.";
}

export function announceNotification(notification, profile, settings = getVoiceNotificationSettings(), relatedRecord = null) {
  if (!notification?.id || !settings.enabled || profile?.voice_enabled === false) return false;
  if (notification.notification_type === "MEDICINE" && settings.medicinesEnabled === false) return false;
  if (notification.notification_type === "APPOINTMENT" && settings.appointmentsEnabled === false) return false;
  const language = profile?.preferred_language === "Telugu" ? "Telugu" : "English";
  const text = notificationAnnouncementText(notification, language, settings.readDetails, relatedRecord);
  const emergency = notification.notification_type === "SOS" || notification.priority === "URGENT";
  return queueSpeech(text, language === "Telugu" ? "te-IN" : "en-IN", profile?.voice_speed || 1, {
    dedupeKey: `notification:${notification.id}`,
    priority: emergency ? 100 : notification.notification_type === "MEDICINE" || notification.notification_type === "APPOINTMENT" ? 25 : 10,
    voiceName: settings.voiceName,
    kind: "notification",
    rememberAsLast: true,
  });
}

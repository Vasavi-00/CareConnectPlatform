import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  announceNotification, getVoiceNotificationSettings, notificationAnnouncementText,
  queueSpeech, saveVoiceNotificationSettings, speakText, stopSpeaking,
} from "./speechSynthesis.js";

const storage = new Map();
const utterances = [];
const synth = {
  speaking: false,
  paused: false,
  speak(utterance) { utterances.push(utterance); this.speaking = true; },
  cancel() { this.speaking = false; },
  getVoices() { return [{ name: "English Test", lang: "en-IN" }, { name: "Telugu Test", lang: "te-IN" }]; },
  pause() { this.paused = true; },
  resume() { this.paused = false; },
};
globalThis.localStorage = {
  getItem(key) { return storage.has(key) ? storage.get(key) : null; },
  setItem(key, value) { storage.set(key, String(value)); },
};
globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
globalThis.window = {
  speechSynthesis: synth,
  SpeechSynthesisUtterance: class SpeechSynthesisUtterance { constructor(text) { this.text = text; } },
  dispatchEvent() {},
};

function finish(utterance = utterances.at(-1)) {
  utterance.onstart?.();
  utterance.onend?.();
  synth.speaking = false;
}

afterEach(() => {
  stopSpeaking();
  utterances.length = 0;
  storage.clear();
});

test("sensitive categories announce privately; details preference only expands eligible records", () => {
  const family = { notification_type: "AI_SUMMARY", title: "Private", message: "Loneliness disclosure" };
  assert.doesNotMatch(notificationAnnouncementText(family, "English", true), /Loneliness/);
  const medicine = { notification_type: "MEDICINE", title: "Medicine: Aspirin", message: "Take one tablet" };
  assert.doesNotMatch(notificationAnnouncementText(medicine, "English", false), /Aspirin|tablet/);
  assert.match(notificationAnnouncementText(medicine, "English", true), /Aspirin/);
  assert.match(notificationAnnouncementText({ notification_type: "SOS", message: "Sensitive coordinates" }, "Telugu", true), /స్థితి/);
});

test("appointment detail announcements use the saved appointment record and local date formatting", () => {
  const notification = { notification_type: "APPOINTMENT", message: "old or incomplete message" };
  const appointment = {
    doctor_name: "Dr. Rao", clinic_name: "City Clinic", location: "12 Main Road",
    appointment_at: "2030-01-02T10:30:00Z",
  };
  const text = notificationAnnouncementText(notification, "English", true, appointment);
  assert.match(text, /Dr\. Rao/);
  assert.match(text, /City Clinic/);
  assert.match(text, /12 Main Road/);
  assert.doesNotMatch(text, /old or incomplete/);
  assert.match(notificationAnnouncementText(notification, "English", false, appointment), /private update/i);
});

test("new notifications queue once, remember only after speech starts, and process urgent items next", () => {
  saveVoiceNotificationSettings({ enabled: true });
  const profile = { preferred_language: "English", voice_speed: 0.8, voice_enabled: true };
  const first = { id: 10, notification_type: "SYSTEM", priority: "NORMAL", title: "Notice", message: "Text" };
  assert.equal(announceNotification(first, profile), true);
  assert.equal(announceNotification(first, profile), false);
  assert.equal(utterances.length, 1);
  const urgent = { id: 11, notification_type: "SOS", priority: "URGENT", title: "Emergency", message: "Update" };
  assert.equal(announceNotification(urgent, profile), true);
  finish(utterances[0]);
  assert.equal(utterances.length, 2);
  assert.match(utterances[1].text, /emergency request status/i);
  finish(utterances[1]);
  assert.equal(announceNotification(first, profile), false);
});

test("disabled preferences and unavailable browsers do not start speech", () => {
  saveVoiceNotificationSettings({ enabled: false });
  const notification = { id: 12, notification_type: "MEDICINE" };
  assert.equal(announceNotification(notification, { voice_enabled: true }), false);
  assert.equal(utterances.length, 0);
  const speech = window.speechSynthesis;
  delete window.speechSynthesis;
  let state = "";
  assert.equal(speakText("Test", "en-IN", 1, (next) => { state = next; }), false);
  assert.equal(state, "unsupported");
  window.speechSynthesis = speech;
});

test("an unavailable Telugu voice reports a fallback status without speaking mismatched language", () => {
  const voices = synth.getVoices;
  synth.getVoices = () => [{ name: "English Test", lang: "en-IN" }];
  let state = "";
  assert.equal(speakText("నమస్కారం", "te-IN", 1, (next) => { state = next; }), true);
  assert.equal(state, "unsupported");
  assert.equal(utterances.length, 0);
  synth.getVoices = voices;
});

test("a browser playback error releases the queue so the next item can play", () => {
  assert.equal(queueSpeech("First", "en-IN"), true);
  assert.equal(queueSpeech("Second", "en-IN"), true);
  utterances[0].onerror?.({ error: "not-allowed" });
  assert.equal(utterances.length, 2);
  assert.equal(utterances[1].text, "Second");
});

test("the common queue serializes speech and uses requested language and rate", () => {
  assert.equal(queueSpeech("నమస్కారం", "te-IN", 0.8), true);
  assert.equal(speakText("Second message", "en-IN", 1.2), true);
  assert.equal(utterances.length, 1);
  assert.equal(utterances[0].lang, "te-IN");
  assert.equal(utterances[0].rate, 0.8);
  finish(utterances[0]);
  assert.equal(utterances.length, 2);
  assert.equal(utterances[1].lang, "en-IN");
  assert.equal(getVoiceNotificationSettings().enabled, false);
});

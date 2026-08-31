export function speakText(
  text,
  language = "en-IN"
) {
  if (
    !text ||
    !("speechSynthesis" in window)
  ) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = language;
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );

  return true;
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

export function isSpeechSupported() {
  return (
    "speechSynthesis" in window
  );
}
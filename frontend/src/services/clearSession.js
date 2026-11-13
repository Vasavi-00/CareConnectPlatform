const SESSION_KEYS = [
  "careconnect_access",
  "careconnect_refresh",
  "careconnect_user",
  "careconnect_mood",
  "careconnect_elder_taken_doses",
  "careconnect_elder_announced_doses",
  "careconnect_elder_taken_pills",
  "careconnect_voice_medicine_reminders",
  "careconnect_companion_voice_speed",
  "careconnect_language",
  "careconnect_high_contrast",
];

/** Clear the signed-in identity and account-specific browser cache on logout. */
export default function clearCareConnectSession() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  document.body.classList.remove(
    "elder-font-normal",
    "elder-font-large",
    "elder-font-xlarge",
    "elder-high-contrast",
  );
}

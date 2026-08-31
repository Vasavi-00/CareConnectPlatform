import en from "./en";
import te from "./te";

export const translations = {
  en,
  te,
};

export function t(
  language,
  key
) {
  return (
    translations[language]?.[key] ??
    translations.en[key] ??
    key
  );
}

export function speechLanguage(
  language
) {
  return language === "te"
    ? "te-IN"
    : "en-IN";
}
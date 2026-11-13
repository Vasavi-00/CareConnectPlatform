const metaEnv = (typeof import.meta !== "undefined" && import.meta.env) ? import.meta.env : {};
const configuredBase = metaEnv.VITE_API_BASE_URL;
const defaultBase = metaEnv.DEV
  ? "http://127.0.0.1:8000/api"
  : "https://careconnect-api.onrender.com/api";
const normalizedBase = (configuredBase || defaultBase).replace(/\/+$/, "");

export const API_BASE_URL = /\/api$/i.test(normalizedBase)
  ? normalizedBase
  : `${normalizedBase}/api`;

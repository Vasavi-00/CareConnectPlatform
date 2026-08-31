const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000/api";

function getToken() {
  return localStorage.getItem("careconnect_access");
}

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}

function listFrom(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

/* =========================
   AUTH / PROFILE
========================= */

export async function getMe() {
  return request("/auth/me/");
}

export async function getElderProfile() {
  return request("/elder/profile/");
}

/* =========================
   MEDICINES
========================= */

export async function getMedicines(elderId) {
  const data = await request(
    `/medicines/?elder_id=${elderId}`
  );

  return listFrom(data);
}

/* =========================
   APPOINTMENTS
========================= */

export async function getAppointments(elderId) {
  const data = await request(
    `/appointments/?elder_id=${elderId}`
  );

  return listFrom(data);
}

/* =========================
   EMERGENCY CONTACTS
========================= */

export async function getEmergencyContacts(elderId) {
  const data = await request(
    `/emergency-contacts/?elder_id=${elderId}`
  );

  return listFrom(data);
}

/* =========================
   NOTIFICATIONS
========================= */

export async function getNotifications() {
  const data = await request(
    "/notifications/"
  );

  return listFrom(data);
}

export async function getUnreadNotifications() {
  const data = await request(
    "/notifications/?unread=true"
  );

  return listFrom(data);
}

export async function getUnreadNotificationCount() {
  return request(
    "/notifications/unread-count/"
  );
}

export async function markNotificationRead(id) {
  return request(
    `/notifications/${id}/read/`,
    {
      method: "PATCH",
    }
  );
}

export async function markAllNotificationsRead() {
  return request(
    "/notifications/mark-all-read/",
    {
      method: "POST",
    }
  );
}
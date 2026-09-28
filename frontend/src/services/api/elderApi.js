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
        data?.error ||
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

export async function getMe() {
  return request("/auth/me/");
}

export async function getElderProfile() {
  return request("/elder/profile/");
}

export async function updateElderProfile(payload) {
  return request("/elder/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getMedicines(elderId) {
  const data = await request(
    `/medicines/?elder_id=${elderId}`
  );

  return listFrom(data);
}

export async function takeMedicine(medicineId, currentQuantity) {
  const nextQuantity = Math.max(0, (Number(currentQuantity) || 0) - 1);
  return request(`/medicines/${medicineId}/`, {
    method: "PATCH",
    body: JSON.stringify({ quantity: nextQuantity }),
  });
}

export async function getAppointments(elderId) {
  const data = await request(
    `/appointments/?elder_id=${elderId}`
  );

  return listFrom(data);
}

export async function getEmergencyContacts(elderId) {
  const data = await request(
    `/emergency-contacts/?elder_id=${elderId}`
  );

  return listFrom(data);
}

export async function getNotifications() {
  const data = await request("/notifications/");
  return listFrom(data);
}

export async function getConnectedFamily() {
  const data = await request("/connections/elder/family/");
  return listFrom(data);
}

export async function getUnreadNotifications() {
  const data = await request("/notifications/?unread=true");
  return listFrom(data);
}

export async function getUnreadNotificationCount() {
  return request("/notifications/unread-count/");
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read/`, {
    method: "PATCH",
  });
}

export async function markAllNotificationsRead() {
  return request("/notifications/mark-all-read/", {
    method: "POST",
  });
}

export async function activateSOS() {
  return request("/notifications/sos/activate/", {
    method: "POST",
  });
}

/* =========================================================
   AI COMPANION
========================================================= */

export async function chatWithAI(message, language = "English") {
  return request("/ai/chat/", {
    method: "POST",
    body: JSON.stringify({ message, language }),
  });
}

export async function getAIConversations() {
  const data = await request("/ai/conversations/");
  return listFrom(data);
}

export async function requestFamilyCall(reason = "Requested a call via AI Companion") {
  return request("/ai/request-call/", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}


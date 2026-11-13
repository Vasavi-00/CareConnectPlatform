import { API_BASE_URL } from "./baseUrl";

function getToken() {
  return localStorage.getItem("careconnect_access");
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (response.status === 401 && !endpoint.includes("/auth/refresh/")) {
    const refreshToken = localStorage.getItem("careconnect_refresh");
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${API_BASE_URL}/auth/refresh/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          }
        );

        if (refreshResponse.ok) {
          const refreshedTokens = await refreshResponse.json();
          if (refreshedTokens?.access) {
            localStorage.setItem("careconnect_access", refreshedTokens.access);
            if (refreshedTokens.refresh) {
              localStorage.setItem("careconnect_refresh", refreshedTokens.refresh);
            }
            headers.Authorization = `Bearer ${refreshedTokens.access}`;
            response = await fetch(
              `${API_BASE_URL}${endpoint}`,
              {
                ...options,
                headers,
              }
            );
          }
        }
      } catch (refreshErr) {
        console.warn("Token refresh attempt failed:", refreshErr);
      }
    }
  }

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

export async function deleteMyAccount() {
  return request("/auth/account/", { method: "DELETE" });
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
    body: JSON.stringify({
      taken: true,
      quantity: nextQuantity,
    }),
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

export async function activateSOS(payload = {}) {
  return request("/notifications/sos/activate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSOSLocation(eventId, payload) {
  return request(`/notifications/sos/${eventId}/location/`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function cancelSOS(eventId) {
  return request(`/notifications/sos/${eventId}/cancel/`, { method: "POST" });
}

/* =========================================================
   AI COMPANION
========================================================= */

export async function chatWithAI(message, language = "English", conversationId = null) {
  return request("/ai/chat/", {
    method: "POST",
    body: JSON.stringify({ message, language, ...(conversationId ? { conversation_id: conversationId } : {}) }),
  });
}

export async function transcribeAudio(audioBlob, language = "English") {
  const formData = new FormData();
  const type = audioBlob.type || "";
  const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") || type.includes("m4a") ? "m4a" : type.includes("wav") ? "wav" : "webm";
  formData.append("audio", audioBlob, `recording.${ext}`);
  formData.append("language", language);
  return request("/ai/transcribe/", {
    method: "POST",
    body: formData,
  });
}

export async function voiceChatWithAI(audioBlob, language = "English", conversationId = null) {
  const formData = new FormData();
  const type = audioBlob.type || "";
  const ext = type.includes("ogg") ? "ogg" : type.includes("mp4") || type.includes("m4a") ? "m4a" : type.includes("wav") ? "wav" : "webm";
  formData.append("audio", audioBlob, `recording.${ext}`);
  formData.append("language", language);
  if (conversationId) {
    formData.append("conversation_id", String(conversationId));
  }
  return request("/ai/voice-chat/", {
    method: "POST",
    body: formData,
  });
}

export async function getAIConversations() {
  const data = await request("/ai/conversations/");
  return listFrom(data);
}

export async function createAIConversation(title = "New conversation") {
  return request("/ai/conversations/", { method: "POST", body: JSON.stringify({ title }) });
}

export async function createConversationSummaryDraft(conversationId) {
  return request(`/ai/conversations/${conversationId}/summary/`, { method: "POST" });
}

export async function getAISummaries() {
  return listFrom(await request("/ai/summaries/"));
}

export async function shareAISummary(summaryId, payload) {
  return request(`/ai/summaries/${summaryId}/share/`, { method: "POST", body: JSON.stringify(payload) });
}

export async function revokeAISummary(summaryId) {
  return request(`/ai/summaries/${summaryId}/revoke/`, { method: "POST" });
}

export async function requestFamilyCall(reason = "Requested a call via AI Companion") {
  return request("/ai/request-call/", {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}


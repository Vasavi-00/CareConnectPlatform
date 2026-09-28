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
    let message = `Request failed with status ${response.status}`;

    if (data?.detail) {
      message = data.detail;
    } else if (data && typeof data === "object") {
      const firstValue = Object.values(data)[0];

      if (Array.isArray(firstValue)) {
        message = firstValue[0];
      } else if (typeof firstValue === "string") {
        message = firstValue;
      }
    }

    throw new Error(message);
  }

  return data;
}

function normalizeList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

/* =========================================================
   FAMILY
========================================================= */

export async function getMe() {
  return request("/auth/me/");
}

export async function getFamilyProfile() {
  return request("/family/profile/");
}

export async function updateFamilyProfile(payload) {
  return request("/family/profile/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getConnectedElders() { 
  const data = await request( "/connections/family/elders/" ); 
  return normalizeList(data); }

export async function connectElder(
  careconnectId
) {

  const normalizedId =
    careconnectId
      ?.trim()
      .toUpperCase();


  if (!normalizedId) {

    throw new Error(
      "Please enter a CareConnect ID."
    );

  }


  return request(
    "/connections/connect/",
    {
      method: "POST",

      body: JSON.stringify({
        careconnect_id:
          normalizedId,
      }),
    }
  );

}

/* ========================================================= ELDER LOOKUP Search an elder using CareConnect ID ========================================================= */ 
export async function lookupElder( 
  careconnectId ) { 
  const normalizedId =
   careconnectId ?.trim() .toUpperCase();
    if (!normalizedId) { 
      throw new Error( "Please enter a CareConnect ID." 

      ); }
       return request( `/connections/elder/${encodeURIComponent( normalizedId )}/` 
      ); }

export async function sendConnectionRequest(
  careconnectId,
  relationshipType = ""
) {
  const normalizedId = careconnectId?.trim().toUpperCase();

  if (!normalizedId) {
    throw new Error("Please enter a CareConnect ID.");
  }

  return request("/connections/request/", {
    method: "POST",
    body: JSON.stringify({
      careconnect_id: normalizedId,
      relationship_type: relationshipType,
    }),
  });
}

/* =========================================================
   MEDICINES
========================================================= */

export async function getMedicines(elderId) {
  const data = await request(
    `/medicines/?elder_id=${elderId}`
  );

  return normalizeList(data);
}

export async function createMedicine(payload) {
  return request("/medicines/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateMedicine(id, payload) {
  return request(`/medicines/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteMedicine(id) {
  return request(`/medicines/${id}/`, {
    method: "DELETE",
  });
}

/* =========================================================
   APPOINTMENTS
========================================================= */

export async function getAppointments(elderId) {
  const data = await request(
    `/appointments/?elder_id=${elderId}`
  );

  return normalizeList(data);
}

export async function createAppointment(payload) {
  return request("/appointments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAppointment(id, payload) {
  return request(`/appointments/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAppointment(id) {
  return request(`/appointments/${id}/`, {
    method: "DELETE",
  });
}

/* =========================================================
   EMERGENCY CONTACTS
========================================================= */

export async function getEmergencyContacts(elderId) {
  const data = await request(
    `/emergency-contacts/?elder_id=${elderId}`
  );

  return normalizeList(data);
}

export async function createEmergencyContact(payload) {
  return request("/emergency-contacts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEmergencyContact(
  id,
  payload
) {
  return request(`/emergency-contacts/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmergencyContact(id) {
  return request(
    `/emergency-contacts/${id}/`,
    {
      method: "DELETE",
    }
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export async function getNotifications() {
  return normalizeList(await request("/notifications/"));
}

export async function markNotificationRead(id) {
  return request(`/notifications/${id}/read/`, { method: "PATCH" });
}

export async function markAllNotificationsRead() {
  return request("/notifications/mark-all-read/", { method: "POST" });
}

/* =========================================================
   AI COMPANION
========================================================= */

export async function getAIConversations(elderId) {
  const query = elderId ? `?elder_id=${elderId}` : "";
  const data = await request(`/ai/conversations/${query}`);
  return normalizeList(data);
}


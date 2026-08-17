const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const mockMedicines = [
  { id: "mock-metformin", name: "Metformin", dosage: "500 mg · 1 tablet", scheduled_time: "08:00", instructions: "After breakfast", status: "taken" },
  { id: "mock-vitamin-d", name: "Vitamin D", dosage: "1 tablet", scheduled_time: "13:00", instructions: "With lunch", status: "taken" },
  { id: "mock-blood-pressure", name: "Blood Pressure Medicine", dosage: "1 tablet", scheduled_time: "20:00", instructions: "After dinner", status: "upcoming" },
];

const mockAppointments = [{
  id: "mock-appointment-1", doctor_name: "Dr. Priya Sharma", specialization: "Cardiologist",
  date_label: "Tomorrow", time: "10:30 AM", location: "Apollo Hospital", status: "confirmed",
}];

function headers() {
  const token = localStorage.getItem("careconnect_access");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  if (!response.ok) throw new Error(`CareConnect service returned ${response.status}`);
  return response.status === 204 ? null : response.json();
}

// The care endpoints below do not exist in the current Django project. Keep
// fallback data in this adapter, so presentation components never own mock data.
export async function getElderProfile() {
  try { return await request("/auth/me/"); }
  catch { return { first_name: "", profile: { font_size: "large", voice_enabled: true }, isMock: true }; }
}

export async function getTodayMedicines() {
  try { return await request("/medicines/today/"); }
  catch { return { results: mockMedicines, isMock: true }; }
}

export async function markMedicineTaken(id) {
  try { return await request(`/medicines/${id}/taken/`, { method: "POST" }); }
  catch { return { id, status: "taken", isMock: true }; }
}

export async function getUpcomingAppointments() {
  try { return await request("/appointments/upcoming/"); }
  catch { return { results: mockAppointments, isMock: true }; }
}

export async function triggerSOS() {
  // Intentionally no simulated call: an unimplemented backend must not imply help was sent.
  return request("/sos/trigger/", { method: "POST" });
}

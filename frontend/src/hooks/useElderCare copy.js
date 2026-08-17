import { useCallback, useEffect, useState } from "react";
import { getElderProfile, getTodayMedicines, getUpcomingAppointments, markMedicineTaken } from "../services/api/elderCareApi";

const list = (payload) => Array.isArray(payload) ? payload : payload?.results || [];

export function useElderCare() {
  const [state, setState] = useState({ loading: true, error: "", profile: null, medicines: [], appointments: [], mock: false });
  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: "" }));
    try {
      const [profile, medicines, appointments] = await Promise.all([getElderProfile(), getTodayMedicines(), getUpcomingAppointments()]);
      setState({ loading: false, error: "", profile, medicines: list(medicines), appointments: list(appointments), mock: Boolean(medicines?.isMock || appointments?.isMock) });
    } catch {
      setState((previous) => ({ ...previous, loading: false, error: "Unable to load your care plan." }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const takeMedicine = async (id) => {
    await markMedicineTaken(id);
    setState((previous) => ({ ...previous, medicines: previous.medicines.map((medicine) => medicine.id === id ? { ...medicine, status: "taken" } : medicine) }));
  };
  return { ...state, load, takeMedicine };
}

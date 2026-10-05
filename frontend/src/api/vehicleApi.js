import api from "./axiosInstance";
import { mockVehicles } from "../data/mockVehicles";

// Backend vehicles first, then any mock vehicles the backend doesn't have yet
export async function getVehicles(params = {}) {
  try {
    const { data } = await api.get("/vehicles", { params });
    const list = Array.isArray(data) ? data : [];
    const names = new Set(list.map((v) => String(v.name).toLowerCase()));

    let extras = mockVehicles.filter((v) => !names.has(v.name.toLowerCase()));
    if (params.type) extras = extras.filter((v) => v.type === params.type);

    return [...list, ...extras];
  } catch {
    return mockVehicles;
  }
}

export async function getVehicle(id) {
  try {
    const { data } = await api.get(`/vehicles/${id}`);
    return data;
  } catch {
    return mockVehicles.find((v) => String(v.id) === String(id)) || null;
  }
}
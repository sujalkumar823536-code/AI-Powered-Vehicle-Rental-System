import api from "./axiosInstance";

export async function getVehicles(params = {}) {
  const { data } = await api.get("/vehicles", { params });
  return Array.isArray(data) ? data : [];
}

export async function getVehicle(id) {
  const { data } = await api.get(`/vehicles/${id}`);
  return data;
}
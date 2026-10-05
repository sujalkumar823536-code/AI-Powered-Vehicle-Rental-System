import api from "./axiosInstance";

export const createBooking = (data) => api.post("/bookings", data);
export const getMyBookings = () => api.get("/bookings/me");
export const cancelBooking = (id) => api.delete(`/bookings/${id}`);

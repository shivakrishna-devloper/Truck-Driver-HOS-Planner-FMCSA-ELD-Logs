import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://truck-driver-hos-planner-fmcsa-eld-logs.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTripPlan = (payload) => api.post("/api/trips/create/", payload);

export default api;

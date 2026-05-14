import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : "https://truck-driver-hos-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTripPlan = (payload) =>
  api.post("/api/trips/create/", payload);

export default api;
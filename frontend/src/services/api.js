import axios from "axios";

const PRODUCTION_API_ORIGIN =
  "https://truck-driver-hos-planner-fmcsa-eld-logs.onrender.com";

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const fallbackBaseUrl = import.meta.env.DEV
    ? "http://127.0.0.1:8000"
    : PRODUCTION_API_ORIGIN;

  return (configuredBaseUrl || fallbackBaseUrl)
    .replace(/\/+$/, "")
    .replace(/\/api$/i, "");
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTripPlan = (payload) => api.post("/api/trips/create/", payload);

export default api;

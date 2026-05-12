import axios from "axios";

const api = axios.create({
  baseURL: "https://truck-driver-hos-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

export const createTripPlan = (payload) =>
  api.post("/api/trips/create/", payload);

export default api;
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // This is http://localhost:4000/api
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to headers if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // store token after login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
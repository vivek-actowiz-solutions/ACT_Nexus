// export const api = import.meta.env.VITE_BACKEND_API_URL;

import axios from "axios";

export const api = import.meta.env.VITE_BACKEND_API_URL?.trim() || "http://localhost:5004";

// ✅ Global flag to prevent multiple redirects
let isLoggingOut = false;

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.data?.forceLogout && !isLoggingOut) {
      isLoggingOut = true; // prevent duplicate redirects

      // Clear all stored tokens/sessions
      localStorage.clear();
      sessionStorage.clear();
      

      // Optionally remove cookies too
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      // Redirect only once
      
      window.location.href = "/ACT-Nexus/login";
    }

    return Promise.reject(err);
  }
);

console.log("✅ Backend API Base URL:", api);
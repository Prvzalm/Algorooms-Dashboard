import axios from "axios";
import { queryClient } from "../queryClient";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("Authorization");
      delete axiosInstance.defaults.headers.common["Authorization"];
      queryClient.clear();
      window.location.href = "/signin"; // redirect to signin
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json-patch+json",
    Accept: "*/*",
  },
});

export default axiosInstance;

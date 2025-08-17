import axios from "axios";
import { queryClient } from "../queryClient";

const axiosInstance = axios.create({
  baseURL: "https://uat-core-api.algorooms.com/api",
  headers: {
    "Content-Type": "application/json-patch+json",
    Accept: "*/*",
  },
});

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       delete axiosInstance.defaults.headers.common["Authorization"];
//       queryClient.clear();
//       window.location.href = "/";
//     }

//     return Promise.reject(error);
//   }
// );

export default axiosInstance;

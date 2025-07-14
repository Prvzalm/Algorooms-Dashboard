import axiosInstance from "./axiosInstance";

export const getTradeEngineLogs = async () => {
  const response = await axiosInstance.post("/Reports/GetTradeEngineLogs");
  return response.data?.Data || [];
};

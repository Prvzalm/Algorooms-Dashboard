import axiosInstance from "./axiosInstance";

export const addBroker = async (payload) => {
  const response = await axiosInstance.post("/Broker/AddBroker", payload);
  return response.data;
};

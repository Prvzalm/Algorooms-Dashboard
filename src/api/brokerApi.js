import axiosInstance from "./axiosInstance";

export const addBroker = async (payload) => {
  const response = await axiosInstance.post("/Broker/AddBroker", payload);
  return response.data;
};

export const startStopTradeEngine = async (payload) => {
  const response = await axiosInstance.post(
    "/Broker/StartStopTradeEngine",
    payload
  );
  return response.data;
};

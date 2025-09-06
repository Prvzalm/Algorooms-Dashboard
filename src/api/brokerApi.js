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

export const updateBrokerAuthCode = async (payload) => {
  const response = await axiosInstance.post(
    "/Broker/UpdateBrokerAuthCode",
    payload
  );
  return response.data;
};

// Delete a broker by BrokerClientId
export const deleteBroker = async ({ BrokerClientId }) => {
  const response = await axiosInstance.post("/Broker/DeleteBroker", {
    BrokerClientId,
  });
  return response.data; // { Status, Message }
};

// Square off all positions under a broker (assumed endpoint)
// NOTE: Assumes backend supports this route. If it differs, update accordingly.
export const squareOffBroker = async ({ BrokerClientId }) => {
  const response = await axiosInstance.post("/Broker/SquareOffBroker", {
    BrokerClientId,
  });
  return response.data; // { Status, Message }
};

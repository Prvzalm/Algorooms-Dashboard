import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import { startStopTradeEngine, updateBrokerAuthCode } from "../api/brokerApi";

export const useMasterBrokerData = () => {
  return useQuery({
    queryKey: ["masterBrokerData"],
    queryFn: async () => {
      const res = await axiosInstance.get("/Broker/GetMasterBrokerData");
      return res.data?.Data || [];
    },
    staleTime: 1000 * 60 * 2,
  });
};

export const useUpdateBrokerAuthCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await updateBrokerAuthCode(payload);
      return res;
    },
    onSuccess: (data) => {
      if (data?.Status && data.Status.toLowerCase() === "error") {
        toast.error(data?.Message || "Auth update failed");
      } else {
        toast.success(data?.Message || "Broker connected");
      }
      queryClient.invalidateQueries(["user-broker-data"]);
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.Message || error?.message || "Request failed";
      toast.error(msg);
    },
  });
};

export const useStartStopTradeEngine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await startStopTradeEngine(payload);
      return res;
    },
    onSuccess: (data) => {
      // Show toast based on API status
      if (data?.Status && data.Status.toLowerCase() === "error") {
        toast.error(data?.Message || "Failed to update trade engine");
      } else {
        toast.success(data?.Message || "Trade engine updated");
      }

      // Invalidate any broker-related queries so UI refreshes
      queryClient.invalidateQueries(["masterBrokerData"]);
      queryClient.invalidateQueries(["brokers"]);
      queryClient.invalidateQueries(["user-broker-data"]);
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.Message || error?.message || "Request failed";
      toast.error(msg);
    },
  });
};

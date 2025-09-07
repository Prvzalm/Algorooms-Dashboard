import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import axiosInstance from "../api/axiosInstance";
import {
  startStopTradeEngine,
  updateBrokerAuthCode,
  deleteBroker,
  squareOffBroker,
  addBroker,
} from "../api/brokerApi";

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

      queryClient.invalidateQueries(["masterBrokerData"]);
      queryClient.invalidateQueries(["user-broker-data"]);
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.Message || error?.message || "Request failed";
      toast.error(msg);
    },
  });
};

export const useAddBroker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await addBroker(payload);
      return res;
    },
    onSuccess: (data) => {
      const isErr = data?.Status && data.Status.toLowerCase() === "error";
      if (isErr) {
        toast.error(data?.Message || "Failed to add broker");
      } else {
        toast.success(data?.Message || "Broker added successfully!");
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

export const useDeleteBroker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ BrokerClientId }) => {
      const res = await deleteBroker({ BrokerClientId });
      return res;
    },
    onSuccess: (data) => {
      const isErr = data?.Status && data.Status.toLowerCase() === "error";
      if (isErr) {
        toast.error(data?.Message || "Failed to delete broker");
      } else {
        toast.success(data?.Message || "Broker deleted");
      }
      // Invalidate exactly this query to avoid multiple refetches
      queryClient.invalidateQueries({ queryKey: ["user-broker-data"], exact: true });
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.Message || error?.message || "Request failed";
      toast.error(msg);
    },
  });
};

export const useSquareOffBroker = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ BrokerClientId }) => {
      const res = await squareOffBroker({ BrokerClientId });
      return res;
    },
    onSuccess: (data) => {
      const isErr = data?.Status && data.Status.toLowerCase() === "error";
      if (isErr) {
        toast.error(data?.Message || "Square off failed");
      } else {
        toast.success(data?.Message || "Squared off successfully");
      }
      // Depending on backend effects, refresh brokerwise strategies and broker data
      queryClient.invalidateQueries(["brokerwise-strategies"]);
      queryClient.invalidateQueries(["user-broker-data"]);
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.Message || error?.message || "Request failed";
      toast.error(msg);
    },
  });
};

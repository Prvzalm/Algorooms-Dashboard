import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

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

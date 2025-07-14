import { useQuery } from "@tanstack/react-query";
import {
  getBrokerwiseDeployedStrategies,
  getMarketplaceStrategies,
  getUserBrokerData,
} from "../api/dashboardApi";

export const useUserBrokerData = () => {
  return useQuery({
    queryKey: ["user-broker-data"],
    queryFn: getUserBrokerData,
    staleTime: 300000,
  });
};

export const useBrokerwiseStrategies = (orderBy = "Name") => {
  return useQuery({
    queryKey: ["brokerwise-strategies", orderBy],
    queryFn: () => getBrokerwiseDeployedStrategies(orderBy),
    staleTime: 300000,
  });
};

export const useMarketplaceStrategies = ({ page = 1, pageSize = 10 }) => {
  return useQuery({
    queryKey: ["marketplace-strategies", page, pageSize],
    queryFn: () => getMarketplaceStrategies({ page, pageSize }),
    keepPreviousData: true,
    staleTime: 300000,
  });
};

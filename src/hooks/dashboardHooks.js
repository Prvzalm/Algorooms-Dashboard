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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useBrokerwiseStrategies = (orderBy = "Name") => {
  return useQuery({
    queryKey: ["brokerwise-strategies", orderBy],
    queryFn: () => getBrokerwiseDeployedStrategies(orderBy),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};



export const useMarketplaceStrategies = ({
  page = 1,
  pageSize = 10,
  orderBy = "Recent",
  filterMargins = "",
}) => {
  return useQuery({
    queryKey: [
      "marketplace-strategies",
      page,
      pageSize,
      orderBy,
      filterMargins,
    ],
    queryFn: () =>
      getMarketplaceStrategies({ page, pageSize, orderBy, filterMargins }),
    keepPreviousData: true,
    staleTime: 300000,
  });
};

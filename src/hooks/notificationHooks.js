import { useQuery } from "@tanstack/react-query";
import { getTradeEngineLogs } from "../api/notificationsApi";

export const useTradeEngineLogs = () => {
  return useQuery({
    queryKey: ["trade-engine-logs"],
    queryFn: getTradeEngineLogs,
    staleTime: 1000 * 60 * 1,
  });
};

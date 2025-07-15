import { useQuery } from "@tanstack/react-query";
import { fetchBackTestCounterDetails } from "../api/backTestApi";

export const useBackTestCounterDetails = () => {
  return useQuery({
    queryKey: ["backtest-counter-details"],
    queryFn: fetchBackTestCounterDetails,
    staleTime: 1000 * 60 * 5,
  });
};

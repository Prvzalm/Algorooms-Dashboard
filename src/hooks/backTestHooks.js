import { useQuery } from "@tanstack/react-query";
import { fetchBackTestCounterDetails, fetchBacktestResult } from "../api/backTestApi";

export const useBackTestCounterDetails = () => {
  return useQuery({
    queryKey: ["backtest-counter-details"],
    queryFn: fetchBackTestCounterDetails,
    staleTime: 1000 * 60 * 5,
  });
};

// date objects or ISO strings accepted; we will transform to encoded ISO
export const useBacktestResult = ({
  strategyId,
  from,
  to,
  userId,
  apiKey,
  isMarketPlaceStrategy = false,
  rangeType = "fixed",
}) => {
  const enabled = Boolean(strategyId && from && to && userId && apiKey);

  return useQuery({
    queryKey: [
      "backtest-result",
      strategyId,
      from,
      to,
      userId,
      isMarketPlaceStrategy,
      rangeType,
    ],
    queryFn: () =>
      fetchBacktestResult({
        strategyId,
        fromDate: from,
        toDate: to,
        userId,
        apiKey,
        isMarketPlaceStrategy,
        rangeType,
      }),
    enabled,
    staleTime: 1000 * 60,
    retry: false, // don't keep retrying after first failure
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
};

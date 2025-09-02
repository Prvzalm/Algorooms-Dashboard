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
  // allow parent to control whether the query is enabled (useful for "Run" button)
  enabled: enabledParam = true,
  // optional numeric token that can be changed to force refetch
  runToken = 0,
}) => {
  // only enable if parent allows AND all required params exist
  const enabled = Boolean(enabledParam && strategyId && from && to && userId && apiKey);

  return useQuery({
    queryKey: [
      "backtest-result",
      strategyId,
      from,
      to,
      userId,
      isMarketPlaceStrategy,
      rangeType,
      runToken,
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

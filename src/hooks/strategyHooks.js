import { useQuery } from "@tanstack/react-query";
import { searchInstrument, userCreatedStrategies } from "../api/strategies";

export const useSearchInstrument = (segmentType, query, enabled = true) => {
  return useQuery({
    queryKey: ["search-instrument", segmentType, query],
    queryFn: () => searchInstrument({ segmentType, query }),
    enabled: enabled && !!query,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserStrategies = ({
  page = 1,
  pageSize = 10,
  strategyType = "created",
  queryText = "",
  orderBy = "Name",
}) => {
  return useQuery({
    queryKey: [
      "user-strategies",
      strategyType,
      queryText,
      orderBy,
      page,
      pageSize,
    ],
    queryFn: () =>
      userCreatedStrategies({
        page,
        pageSize,
        strategyType,
        queryText,
        orderBy,
      }),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });
};

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { searchInstrument, userCreatedStrategies } from "../api/strategies";
import axiosInstance from "../api/axiosInstance";

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

export const useCreateStrategyMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post(
        "/strategies/CreateStrategy",
        payload
      );
      if (res?.data?.Status !== "Success") {
        throw new Error(res?.data?.Message || "Failed to create strategy");
      }
      return res.data.Data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
};

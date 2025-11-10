import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import {
  searchInstrument,
  userCreatedStrategies,
  createStrategy,
  getIndicatorMaster,
  changeDeployedStrategyTradeMode,
  squareOffStrategy,
  duplicateStrategy,
  getStrategyDetailsForEdit,
  deleteStrategy,
  getStrategyDetailsById,
  deployStrategy,
  removeStrategyDeployment,
} from "../api/strategies";
import axiosInstance from "../api/axiosInstance";

export const useSearchInstrument = (segmentType, query, enabled = true) => {
  return useQuery({
    queryKey: ["search-instrument", segmentType, query],
    queryFn: () => searchInstrument({ segmentType, query }),
    enabled: enabled,
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
    mutationFn: (payload) => createStrategy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["strategies"] });
      qc.invalidateQueries({ queryKey: ["user-strategies"] });
    },
  });
};

export const useIndicatorMaster = (enabled = true) => {
  return useQuery({
    queryKey: ["indicator-master"],
    queryFn: () => getIndicatorMaster(),
    enabled,
    staleTime: 10 * 60 * 1000,
  });
};

export const useChangeDeployedStrategyTradeMode = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => changeDeployedStrategyTradeMode(payload),
    onSuccess: (data) => {
      const status = data?.Status?.toLowerCase();
      if (status === "success") {
        toast.success(data?.Message || "Updated Successfully");
      } else {
        toast.error(data?.Message || "Update failed");
      }
      qc.invalidateQueries({ queryKey: ["brokerwise-strategies"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.Message || err.message || "Request failed";
      toast.error(msg);
    },
  });
};

export const useSquareOffStrategyMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => squareOffStrategy(payload),
    onSuccess: (data) => {
      const status = data?.Status?.toLowerCase();
      if (status === "success") {
        toast.success(data?.Message || "Squared Off");
      } else {
        toast.error(data?.Message || "Square off failed");
      }
      qc.invalidateQueries({ queryKey: ["brokerwise-strategies"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.Message || err.message || "Request failed";
      toast.error(msg);
    },
  });
};

export const useDuplicateStrategy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => duplicateStrategy(payload),
    onSuccess: (data) => {
      toast.success(data?.Message || "Strategy duplicated");
      // Invalidate user strategies so new copy shows up
      qc.invalidateQueries({ queryKey: ["user-strategies"] });
    },
    onError: (err) => {
      const msg = err?.message || err?.response?.data?.Message || "Duplication failed";
      toast.error(msg);
    },
  });
};

export const useStrategyDetailsForEdit = (strategyId, enabled = true) => {
  return useQuery({
    queryKey: ["strategy-details-edit", strategyId],
    queryFn: () => getStrategyDetailsForEdit(strategyId),
    enabled: !!strategyId && enabled,
    // staleTime: 1000 * 60,
  });
};

export const useDeleteStrategy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (strategyId) => deleteStrategy(strategyId),
    onSuccess: (data) => {
      toast.success(data?.Message || "Strategy deleted");
      qc.invalidateQueries({ queryKey: ["user-strategies"] });
    },
    onError: (err) => {
      const msg = err?.message || err?.response?.data?.Message || "Delete failed";
      toast.error(msg);
    },
  });
};

// Fetch details by id (for deploy popup)
export const useStrategyDetailsById = (strategyId, enabled = true) => {
  return useQuery({
    queryKey: ["strategy-details-by-id", strategyId],
    queryFn: () => getStrategyDetailsById(strategyId),
    enabled: !!strategyId && enabled,
    staleTime: 1000 * 60,
  });
};

// Deploy strategy mutation
export const useDeployStrategy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => deployStrategy(payload),
    onSuccess: (data) => {
      if (data?.Message) toast.success(data.Message);
      // Refresh brokerwise strategies and possibly marketplace/user lists
      qc.invalidateQueries({ queryKey: ["brokerwise-strategies"] });
      qc.invalidateQueries({ queryKey: ["user-strategies"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.Message || err?.message || "Failed to deploy";
      toast.error(msg);
    },
  });
};

export const useRemoveStrategyDeployment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => removeStrategyDeployment(payload),
    onSuccess: (data) => {
      if (data?.Message) toast.success(data.Message);
      qc.invalidateQueries({ queryKey: ["brokerwise-strategies"] });
      qc.invalidateQueries({ queryKey: ["user-strategies"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.Message || err?.message || "Failed to remove deployment";
      toast.error(msg);
    },
  });
};

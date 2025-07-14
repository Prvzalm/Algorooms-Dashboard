import { useMutation, useQuery } from "@tanstack/react-query";
import { getBrokerPricingPlan } from "../api/subscriptionApi";
import axiosInstance from "../api/axiosInstance";

export const useBrokerPlans = (planType, apiKey) =>
  useQuery({
    queryKey: ["broker-pricing", planType],
    queryFn: () => getBrokerPricingPlan(planType, apiKey),
    enabled: !!planType,
    staleTime: 1000 * 60 * 5,
  });

export const useBacktestPlans = (apiKey) => {
  return useQuery({
    queryKey: ["backtestPlans", apiKey],
    queryFn: async () => {
      const response = await axiosInstance.post(
        "/Subscription/GetBacktestPricingPlan",
        { ApiKey: apiKey }
      );
      return response.data?.Data || [];
    },
  });
};

export const usePaymentDetails = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post(
        "/Subscription/GetPaymentSubscriptionDetails",
        payload
      );
      return res.data?.Data;
    },
  });
};

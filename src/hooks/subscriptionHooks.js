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

export const usePaymentDetails = (payload) => {
  return useQuery({
    queryKey: ["paymentDetails", payload],
    queryFn: async () => {
      const res = await axiosInstance.post(
        "/Subscription/GetPaymentSubscriptionDetails",
        payload
      );
      return res.data?.Data;
    },
    enabled: !!payload,
    staleTime: 1000 * 60 * 2,
  });
};

export const useSubscriptionQuery = () =>
  useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetUserSubscruotionDetail");
      if (!Array.isArray(res.data) || res.data.length === 0)
        throw new Error("No subscription found");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

import axiosInstance from "./axiosInstance";

export const getBrokerPricingPlan = async (
  planType = "quarterly",
  apiKey = ""
) => {
  const response = await axiosInstance.post(
    "/Subscription/GetBrokerPricingPlan",
    {
      PlanType: planType.toLowerCase(),
      ApiKey: apiKey,
    }
  );
  return response.data?.Data?.SubscriptionPlanDetail || [];
};

import axiosInstance from "./axiosInstance";

export const getUserBrokerData = async () => {
  const response = await axiosInstance.get("/Broker/GetUserBrokerData");
  return response?.data?.Data;
};
export const getBrokerwiseDeployedStrategies = async ({ orderBy = "Name" }) => {
  const response = await axiosInstance.post(
    "/strategies/GetBrokerwiseDeployedStrategy",
    {
      OrderBy: orderBy,
    }
  );
  return response?.data?.Data;
};

export const getMarketplaceStrategies = async ({
  page = 1,
  pageSize = 10,
  orderBy = "Recent",
  filterMargins = "",
} = {}) => {
  const response = await axiosInstance.post(
    "/strategies/GetMarketPlaceStrategy",
    {
      FilterMarket: "",
      FilterStrategyTypes: "",
      FilterMargins: filterMargins, // e.g. "1-100000"
      OrderBy: orderBy, // "Recent" | "MaxSubscriptions" | "Margin"
      PageIndex: page,
      PageSize: pageSize,
    }
  );

  return response.data?.Data?.StrategyData || [];
};

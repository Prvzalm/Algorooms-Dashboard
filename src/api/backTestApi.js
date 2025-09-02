import axiosInstance from "./axiosInstance";
import axios from "axios";

export const fetchBackTestCounterDetails = async () => {
  const response = await axiosInstance.get(
    "/BackTest/GetBackTestCounterDetails"
  );
  if (response.data.Status !== "Success")
    throw new Error("Failed to load wallet");
  return response.data.Data;
};

// Direct backtest result API (external base URL)
// params: { strategyId, fromDate, toDate, isMarketPlaceStrategy=false, userId, apiKey, rangeType="fixed" }
export const fetchBacktestResult = async (params) => {
  const {
    strategyId,
    fromDate,
    toDate,
    isMarketPlaceStrategy = false,
    userId,
    apiKey = "abc",
    rangeType = "fixed",
  } = params || {};

  if (!strategyId || !fromDate || !toDate || !userId || !apiKey) {
    throw new Error("Missing required backtest query params");
  }

  const queryParams = new URLSearchParams({
    StrategyId: String(strategyId),
    FromDate: fromDate,
    ToDate: toDate,
    isMarketPlaceStrategy: String(isMarketPlaceStrategy),
    UserId: userId,
    ApiKey: apiKey,
    RangeType: rangeType,
  });

  // Use local dev proxy path to avoid CORS during development
  const proxied = `/btapi/backtest?${queryParams.toString()}`;
  const response = await axios.get(proxied);
  const data = response?.data;
  if (data?.Status !== "Success") {
    throw new Error(data?.Message || "Failed to fetch backtest result");
  }
  return data.Data; // normalized Data object
};

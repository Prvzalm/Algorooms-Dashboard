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
  if (!strategyId || !fromDate || !toDate || !userId) {
    throw new Error("Missing required backtest query params: strategyId, fromDate, toDate, userId");
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

  const response = await axios.get(`/backtest?${queryParams.toString()}`);
  const data = response?.data;
  if (data?.Status !== "Success") {
    throw new Error(data?.Message || "Failed to fetch backtest result");
  }
  return data.Data;
};

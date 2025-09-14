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

  let response;
  const finalUrl = `/btapi/backtest?${queryParams.toString()}`;
  try {
    response = await axios.get(finalUrl, { validateStatus: () => true });
  } catch (e) {
    // Network / CORS style error (shouldn't happen same-origin unless proxy missing and server blocks)
    throw new Error("Backtest request failed (network). Ensure /btapi proxy is configured in production.");
  }

  // If proxy not configured in prod, static host likely returns 404 HTML page
  if (response.status === 404) {
    const ct = response.headers?.["content-type"] || "";
    if (typeof response.data === "string" && ct.includes("text/html")) {
      throw new Error("/btapi proxy not configured on production host. Add reverse proxy to backtest service.");
    }
  }

  const data = response.data;
  if (!data || typeof data !== "object") {
    throw new Error("Unexpected backtest response format. Proxy may be returning HTML instead of JSON.");
  }
  if (data?.Status !== "Success") {
    throw new Error(data?.Message || "Failed to fetch backtest result");
  }
  return data.Data;
};

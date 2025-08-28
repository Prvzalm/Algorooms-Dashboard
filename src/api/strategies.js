import axiosInstance from "./axiosInstance";

export const searchInstrument = async ({ segmentType, query }) => {
  const response = await axiosInstance.post("/strategies/SearchInstrument", {
    SegmentType: segmentType,
    SearchQuery: query,
  });
  return response.data?.Data || [];
};

export const userCreatedStrategies = async ({
  page = 1,
  pageSize = 10,
  strategyType = "created",
  queryText = "",
  orderBy = "Name",
}) => {
  const response = await axiosInstance.post(
    "/strategies/GetUserCreatedStrategyList",
    {
      StrategyNameQueryText: queryText,
      OrderBy: orderBy,
      StrategyType: strategyType,
      PageIndex: page,
      PageSize: pageSize,
    }
  );

  return response.data?.Data?.StrategyData || [];
};

export const createStrategy = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/strategies/CreateStrategy",
      payload
    );
    const { Status, Message, Data } = response?.data || {};
    if (Status !== "Success") {
      throw new Error(Message || "Failed to create strategy");
    }
    return Data;
  } catch (err) {
    const serverMsg =
      err?.response?.data?.Message ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Failed to create strategy";
    throw new Error(serverMsg);
  }
};

export const getIndicatorMaster = async () => {
  const response = await axiosInstance.post(
    "/strategies/GetIndicatorMaster",
    {}
  );
  const { Status, Data, Message } = response?.data || {};
  if (Status !== "Success") {
    throw new Error(Message || "Failed to load indicators");
  }
  return Data; // { Indicators, PriceActionIndicators, Comparers, Intervals }
};

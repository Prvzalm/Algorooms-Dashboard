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

// Change deployed strategy trade mode / running state
// Payload shape example:
// { StrategyId, BrokerClientId, BrokerId, isLiveMode: boolean, ActionType: 'Start'|'Stop'|'Live'|'Paper' }
export const changeDeployedStrategyTradeMode = async (payload) => {
  const response = await axiosInstance.post(
    "/strategies/DeployedStrategyChangeTradeMode",
    payload
  );
  return response?.data; // {Status, Message, ...}
};

// Square off (close) a deployed strategy positions
// Payload: { StrategyId, BrokerClientId, BrokerId }
export const squareOffStrategy = async (payload) => {
  const response = await axiosInstance.post(
    "/strategies/SquareOffStrategy",
    payload
  );
  return response?.data; // {Status, Message}
};

// Duplicate an existing strategy (from marketplace or user) into the user's account
// Expected payload (assumed): { StrategyId: string|number, StrategyName: string }
// Returns: { Status, Message, Data }
export const duplicateStrategy = async (payload) => {
  try {
    const response = await axiosInstance.post(
      "/strategies/DuplicateStrategy",
      payload
    );
    const { Status, Message, Data } = response?.data || {};
    if (!Status || Status.toLowerCase() !== "success") {
      throw new Error(Message || "Failed to duplicate strategy");
    }
    return { Message, Data };
  } catch (err) {
    const serverMsg =
      err?.response?.data?.Message ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Failed to duplicate strategy";
    throw new Error(serverMsg);
  }
};

// Fetch strategy details for editing
// Returns raw StrategyDetails object
export const getStrategyDetailsForEdit = async (strategyId) => {
  if (!strategyId) throw new Error("strategyId required");
  try {
    const response = await axiosInstance.post(
      "/strategies/GetStrategyDetailsOnEdit",
      { StrategyId: Number(strategyId) }
    );
    const { Status, Data, Message } = response?.data || {};
    if (!Status || Status.toLowerCase() !== "success") {
      throw new Error(Message || "Failed to load strategy details");
    }
    return Data?.StrategyDetails || null;
  } catch (err) {
    const serverMsg =
      err?.response?.data?.Message ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Failed to load strategy details";
    throw new Error(serverMsg);
  }
};

// Delete a strategy by id
export const deleteStrategy = async (strategyId) => {
  if (!strategyId) throw new Error("strategyId required");
  try {
    const response = await axiosInstance.post(
      "/strategies/DeleteStrategy",
      { StrategyId: Number(strategyId) }
    );
    const { Status, Message } = response?.data || {};
    if (!Status || Status.toLowerCase() !== "success") {
      throw new Error(Message || "Failed to delete strategy");
    }
    return { Message };
  } catch (err) {
    const serverMsg =
      err?.response?.data?.Message ||
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err.message ||
      "Failed to delete strategy";
    throw new Error(serverMsg);
  }
};

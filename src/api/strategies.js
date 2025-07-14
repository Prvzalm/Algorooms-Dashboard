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

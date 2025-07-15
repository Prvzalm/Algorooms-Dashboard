import axiosInstance from "./axiosInstance";

export const fetchBackTestCounterDetails = async () => {
  const response = await axiosInstance.get(
    "/BackTest/GetBackTestCounterDetails"
  );
  if (response.data.Status !== "Success")
    throw new Error("Failed to load wallet");
  return response.data.Data;
};

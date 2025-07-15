import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

export const useWalletQuery = () =>
  useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetUserWallet");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load wallet");
      return res.data.Data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useWalletTransactions = () =>
  useQuery({
    queryKey: ["walletTransactions"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetWalletTransaction");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load wallet transactions");
      return res.data.Data;
    },
    staleTime: 1000 * 60 * 5,
  });

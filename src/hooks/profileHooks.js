import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export const useProfileQuery = () =>
  useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/getProfileData");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load profile");
      return res.data.Data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post("/profile/updateProfile", payload, {
        headers: {
          "Content-Type": "application/json-patch+json",
        },
      });
      if (res.data.Status !== "Success") {
        throw new Error(res.data.Message || "Profile update failed");
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
    },
  });
};

export const useNotificationsData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["notificationsData"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetNotificationsData");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load notifications");
      return res.data.Data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUserNotifications = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["userNotifications"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetUserNotifications");
      return res.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

export const useReferralData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["referralData"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetReferralData");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load referral data");
      return res.data.Data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCouponsData = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ["couponsData"],
    queryFn: async () => {
      const res = await axiosInstance.get("/profile/GetCouponsData");
      if (res.data.Status !== "Success")
        throw new Error("Failed to load coupons");
      return res.data.Data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5,
  });
};

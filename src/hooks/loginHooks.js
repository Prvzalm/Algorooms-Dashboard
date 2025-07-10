import { useMutation } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

export const useChangePasswordMutation = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post("/home/changePassword", payload, {
        headers: {
          "Content-Type": "application/json-patch+json",
        },
      });

      if (res.data.Status !== "Success") {
        throw new Error(res.data.Message || "Password change failed");
      }

      return res.data;
    },
  });
};

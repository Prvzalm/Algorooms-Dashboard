import axiosInstance from "./axiosInstance";

export const getProfileData = async () => {
    const res = await axiosInstance.get("/profile/getProfileData");
    if (res.data.Status !== "Success") throw new Error(res.data.Message || "Failed to load profile");
    return res.data.Data;
};
